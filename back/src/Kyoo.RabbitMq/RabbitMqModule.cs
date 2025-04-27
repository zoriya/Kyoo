// Kyoo - A portable and vast media library solution.
// Copyright (c) Kyoo.
//
// See AUTHORS.md and LICENSE file in the project root for full license information.
//
// Kyoo is free software: you can redistribute it and/or modify
// it under the terms of the GNU General Public License as published by
// the Free Software Foundation, either version 3 of the License, or
// any later version.
//
// Kyoo is distributed in the hope that it will be useful,
// but WITHOUT ANY WARRANTY; without even the implied warranty of
// MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE. See the
// GNU General Public License for more details.
//
// You should have received a copy of the GNU General Public License
// along with Kyoo. If not, see <https://www.gnu.org/licenses/>.

using System.Net.Security;
using System.Security.Cryptography.X509Certificates;
using Kyoo.Abstractions.Controllers;
using Microsoft.AspNetCore.Builder;
using Microsoft.AspNetCore.WebUtilities;
using Microsoft.Extensions.Configuration;
using Microsoft.Extensions.DependencyInjection;
using RabbitMQ.Client;

namespace Kyoo.RabbitMq;

public static class RabbitMqModule
{
	public static void ConfigureRabbitMq(this WebApplicationBuilder builder)
	{
		builder.Services.AddSingleton(_ =>
		{
			ConnectionFactory factory = new();

			// See https://www.rabbitmq.com/docs/uri-spec
			string? connectionString = builder.Configuration.GetValue<string>("RABBITMQ_URL");
			if (!string.IsNullOrEmpty(connectionString))
				factory._ConfigureFactoryWithConnectionString(connectionString);
			else
				factory._ConfigureFactoryWithEnvironmentVars(builder.Configuration);

			return factory.CreateConnection();
		});
		builder.Services.AddSingleton<RabbitProducer>();
		builder.Services.AddSingleton<IScanner, ScannerProducer>();
	}

	private static void _ConfigureFactoryWithConnectionString(
		this ConnectionFactory factory,
		string? connectionString
	)
	{
		if (string.IsNullOrEmpty(connectionString))
			return;

		// Important: setting this property will not use any query parameters, so they must be parsed here instead..
		factory.Uri = new Uri(connectionString);

		// Support query parameters defined here:
		// https://www.rabbitmq.com/docs/uri-query-parameters
		Dictionary<string, Microsoft.Extensions.Primitives.StringValues> queryParameters =
			QueryHelpers.ParseQuery(factory.Uri.Query);

		queryParameters.TryGetValue(
			"heartbeat",
			out Microsoft.Extensions.Primitives.StringValues heartbeats
		);
		if (int.TryParse(heartbeats.LastOrDefault(), out int heartbeatValue))
			factory.RequestedHeartbeat = TimeSpan.FromSeconds(heartbeatValue);

		queryParameters.TryGetValue(
			"connection_timeout",
			out Microsoft.Extensions.Primitives.StringValues connectionTimeouts
		);
		if (int.TryParse(connectionTimeouts.LastOrDefault(), out int connectionTimeoutValue))
			factory.RequestedConnectionTimeout = TimeSpan.FromSeconds(connectionTimeoutValue);

		queryParameters.TryGetValue(
			"channel_max",
			out Microsoft.Extensions.Primitives.StringValues channelMaxValues
		);
		if (ushort.TryParse(channelMaxValues.LastOrDefault(), out ushort channelMaxValue))
			factory.RequestedChannelMax = channelMaxValue;

		if (!factory.Ssl.Enabled)
			return;

		queryParameters.TryGetValue(
			"cacertfile",
			out Microsoft.Extensions.Primitives.StringValues caCertFiles
		);
		var caCertFile = caCertFiles.LastOrDefault();
		if (!string.IsNullOrEmpty(caCertFile))
		{
			// Load the cert once at startup instead of on every connection.
			X509Certificate2Collection rootCACollection = [];
			rootCACollection.ImportFromPemFile(caCertFile);

			// This is a custom validator that obeys the set SslPolicyErrors, while also using the CA cert specified in the query string.
			factory.Ssl.CertificateValidationCallback = (
				sender,
				certificate,
				chain,
				sslPolicyErrors
			) =>
			{
				// If no cert was provided
				if (sslPolicyErrors.HasFlag(SslPolicyErrors.RemoteCertificateNotAvailable))
				{
					// Accept the cert anyway if the client was explicitly configured to ignore this.
					if (
						factory.Ssl.AcceptablePolicyErrors.HasFlag(
							SslPolicyErrors.RemoteCertificateNotAvailable
						)
					)
						return true;
					// Otherwise, reject it.
					return false;
				}

				// If the cert hostname does not match
				if (sslPolicyErrors.HasFlag(SslPolicyErrors.RemoteCertificateNameMismatch))
				{
					// Accept the cert anyway if the client was explicitly configured to ignore this.
					if (
						factory.Ssl.AcceptablePolicyErrors.HasFlag(
							SslPolicyErrors.RemoteCertificateNameMismatch
						)
					)
						return true;
					// Otherwise, reject it.
					return false;
				}

				// This shouldn't ever happen, and is mostly just here to satisfy the linter
				if (chain == null || certificate == null)
					return false;

				// Verify that the certificate came from the specified CA.
				chain.ChainPolicy.ExtraStore.AddRange(
					chain.ChainElements.Select(x => x.Certificate).ToArray()
				);
				chain.ChainPolicy.CustomTrustStore.Clear();
				chain.ChainPolicy.TrustMode = X509ChainTrustMode.CustomRootTrust;
				chain.ChainPolicy.CustomTrustStore.AddRange(rootCACollection);

				return chain.Build(new X509Certificate2(certificate));
			};
		}

		queryParameters.TryGetValue("certfile", out var certfiles);
		var certfile = certfiles.LastOrDefault();
		queryParameters.TryGetValue("keyfile", out var keyfiles);
		var keyfile = keyfiles.LastOrDefault();
		if (!string.IsNullOrEmpty(certfile) && !string.IsNullOrEmpty(keyfile))
			factory.Ssl.Certs = [X509Certificate2.CreateFromPemFile(certfile, keyfile)];

		queryParameters.TryGetValue("verify", out var verifyValues);
		switch (verifyValues.LastOrDefault())
		{
			case "verify_none":
				factory.Ssl.AcceptablePolicyErrors = ~SslPolicyErrors.None;
				break;
			case "verify_peer":
				factory.Ssl.AcceptablePolicyErrors = SslPolicyErrors.None;
				break;
		}

		queryParameters.TryGetValue(
			"server_name_indication",
			out Microsoft.Extensions.Primitives.StringValues sniValues
		);
		var sni = sniValues.LastOrDefault();
		if (!string.IsNullOrEmpty(sni))
		{
			if (sni == "disabled") // Special value, see https://www.rabbitmq.com/docs/ssl#erlang-ssl
			{
				factory.Ssl.ServerName = null;
				factory.Ssl.AcceptablePolicyErrors |= SslPolicyErrors.RemoteCertificateNameMismatch;
			}
			else
				factory.Ssl.ServerName = sni;
		}

		queryParameters.TryGetValue(
			"auth_mechanism",
			out Microsoft.Extensions.Primitives.StringValues authMechanisms
		);
		if (authMechanisms.Count > 0)
		{
			factory.AuthMechanisms.Clear();
			foreach (var authMechanism in authMechanisms)
			{
				switch (authMechanism)
				{
					case "external":
						factory.AuthMechanisms.Add(new ExternalMechanismFactory());
						break;
					case "plain":
						factory.AuthMechanisms.Add(new PlainMechanismFactory());
						break;
					default:
						throw new NotSupportedException(
							$"Unsupported authentication mechanism: {authMechanism}"
						);
				}
			}
		}
	}

	private static void _ConfigureFactoryWithEnvironmentVars(
		this ConnectionFactory factory,
		IConfigurationManager configuration
	)
	{
		factory.UserName = _GetNonEmptyString(
			configuration.GetValue<string>("RABBITMQ_DEFAULT_USER"),
			factory.UserName,
			"guest"
		);
		factory.Password = _GetNonEmptyString(
			configuration.GetValue<string>("RABBITMQ_DEFAULT_PASS"),
			factory.Password,
			"guest"
		);
		factory.HostName = _GetNonEmptyString(
			configuration.GetValue<string>("RABBITMQ_HOST"),
			factory.HostName,
			"rabbitmq"
		);
		var port = configuration.GetValue<int?>("RABBITMQ_PORT");
		if (port != null)
			factory.Port = port.Value;
		else if (factory.Port == 0)
			factory.Port = 5672;
	}

	private static string _GetNonEmptyString(params string?[] values)
	{
		foreach (var value in values)
			if (!string.IsNullOrEmpty(value))
				return value;
		return string.Empty;
	}
}
