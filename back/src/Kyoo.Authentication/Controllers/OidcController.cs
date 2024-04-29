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

using System;
using System.Collections.Generic;
using System.ComponentModel.DataAnnotations;
using System.Net.Http;
using System.Net.Http.Json;
using System.Text;
using System.Text.Json;
using System.Threading.Tasks;
using Kyoo.Abstractions.Controllers;
using Kyoo.Abstractions.Models;
using Kyoo.Authentication.Models;
using Kyoo.Authentication.Models.DTO;

namespace Kyoo.Authentication;

public class OidcController(
	IUserRepository users,
	IHttpClientFactory clientFactory,
	PermissionOption options
)
{
	private async Task<(User, ExternalToken)> _TranslateCode(string provider, string code)
	{
		OidcProvider prov = options.OIDC[provider];

		HttpClient client = clientFactory.CreateClient();

		Dictionary<string, string> data =
			new()
			{
				["code"] = code,
				["redirect_uri"] = $"{options.PublicUrl.TrimEnd('/')}/api/auth/logged/{provider}",
				["grant_type"] = "authorization_code",
			};

		if (prov.ClientAuthMethod == AuthMethod.ClientSecretBasic)
		{
			string auth = Convert.ToBase64String(
				Encoding.UTF8.GetBytes($"{prov.ClientId}:{prov.Secret}")
			);
			client.DefaultRequestHeaders.Add("Authorization", $"Basic {auth}");
		}
		else if (prov.ClientAuthMethod == AuthMethod.ClientSecretPost)
		{
			data["client_id"] = prov.ClientId;
			data["client_secret"] = prov.Secret;
		}

		HttpResponseMessage resp = prov.TokenUseJsonBody
			? await client.PostAsJsonAsync(prov.TokenUrl, data)
			: await client.PostAsync(prov.TokenUrl, new FormUrlEncodedContent(data));
		if (!resp.IsSuccessStatusCode)
			throw new ValidationException(
				$"Invalid code or configuration. {resp.StatusCode}: {await resp.Content.ReadAsStringAsync()}"
			);
		JwtToken? token = await resp.Content.ReadFromJsonAsync<JwtToken>();
		if (token is null)
			throw new ValidationException("Could not retrive token.");

		client.DefaultRequestHeaders.Remove("Authorization");
		client.DefaultRequestHeaders.Add("Authorization", $"{token.TokenType} {token.AccessToken}");
		Dictionary<string, string>? extraHeaders = prov.GetExtraHeaders?.Invoke(prov);
		if (extraHeaders is not null)
		{
			foreach ((string key, string value) in extraHeaders)
				client.DefaultRequestHeaders.Add(key, value);
		}

		JwtProfile? profile = await client.GetFromJsonAsync<JwtProfile>(prov.ProfileUrl);
		if (profile is null || profile.Sub is null)
			throw new ValidationException(
				$"Missing sub on user object. Got: {JsonSerializer.Serialize(profile)}"
			);
		ExternalToken extToken =
			new()
			{
				Id = profile.Sub,
				Token = token,
				ProfileUrl = prov.GetProfileUrl?.Invoke(profile),
			};
		User newUser = new();
		if (profile.Email is not null)
			newUser.Email = profile.Email;
		if (profile.Username is null)
		{
			throw new ValidationException(
				$"Could not find a username for the user. You may need to add more scopes. Fields: {string.Join(',', profile.Extra)}"
			);
		}
		extToken.Username = profile.Username;
		newUser.Username = profile.Username;
		newUser.Slug = Utils.Utility.ToSlug(newUser.Username);
		newUser.ExternalId.Add(provider, extToken);
		return (newUser, extToken);
	}

	public async Task<User> LoginViaCode(string provider, string code)
	{
		(User newUser, ExternalToken extToken) = await _TranslateCode(provider, code);
		User? user = await users.GetByExternalId(provider, extToken.Id);
		if (user == null)
		{
			try
			{
				user = await users.Create(newUser);
			}
			catch
			{
				throw new ValidationException(
					"A user already exists with the same username. If this is you, login via username and then link your account."
				);
			}
		}
		return user;
	}

	public async Task<User> LinkAccountOrLogin(Guid userId, string provider, string code)
	{
		(_, ExternalToken extToken) = await _TranslateCode(provider, code);
		User? user = await users.GetByExternalId(provider, extToken.Id);
		if (user != null)
			return user;
		return await users.AddExternalToken(userId, provider, extToken);
	}
}
