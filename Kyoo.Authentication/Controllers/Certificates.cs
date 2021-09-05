using System;
using System.IO;
using System.Security.Cryptography.X509Certificates;
using Kyoo.Authentication.Models;
using Microsoft.Extensions.DependencyInjection;
using Org.BouncyCastle.Asn1.X509;
using Org.BouncyCastle.Crypto;
using Org.BouncyCastle.Crypto.Generators;
using Org.BouncyCastle.Crypto.Operators;
using Org.BouncyCastle.Math;
using Org.BouncyCastle.Pkcs;
using Org.BouncyCastle.Security;
using Org.BouncyCastle.Utilities;
using Org.BouncyCastle.X509;
using X509Certificate = Org.BouncyCastle.X509.X509Certificate;

namespace Kyoo.Authentication
{
	/// <summary>
	/// A class containing multiple extensions methods to manage certificates.
	/// </summary>
	public static class Certificates
	{
		/// <summary>
		/// Add the certificate file to the identity server. If the certificate will expire soon, automatically renew it.
		/// If no certificate exists, one is generated.
		/// </summary>
		/// <param name="builder">The identity server that will be modified.</param>
		/// <param name="options">The certificate options</param>
		/// <returns>The initial builder to allow chain-calls.</returns>
		public static IIdentityServerBuilder AddSigninKeys(this IIdentityServerBuilder builder,
			CertificateOption options)
		{
			X509Certificate2 certificate = _GetCertificate(options);
			builder.AddSigningCredential(certificate);

			if (certificate.NotAfter.AddDays(-7) <= DateTime.UtcNow)
			{
				Console.WriteLine("Signin certificate will expire soon, renewing it.");
				if (File.Exists(options.OldFile))
					File.Delete(options.OldFile);
				File.Move(options.File, options.OldFile);
				builder.AddValidationKey(_GenerateCertificate(options.File, options.Password));
			}
			else if (File.Exists(options.OldFile))
				builder.AddValidationKey(_GetExistingCredential(options.OldFile, options.Password));
			return builder;
		}

		/// <summary>
		/// Get or generate the sign-in certificate.
		/// </summary>
		/// <param name="options">The certificate options</param>
		/// <returns>A valid certificate</returns>
		private static X509Certificate2 _GetCertificate(CertificateOption options)
		{
			return File.Exists(options.File)
				? _GetExistingCredential(options.File, options.Password)
				: _GenerateCertificate(options.File, options.Password);
		}

		/// <summary>
		/// Load a certificate from a file
		/// </summary>
		/// <param name="file">The path of the certificate</param>
		/// <param name="password">The password of the certificate</param>
		/// <returns>The loaded certificate</returns>
		private static X509Certificate2 _GetExistingCredential(string file, string password)
		{
			X509KeyStorageFlags storeFlags = X509KeyStorageFlags.MachineKeySet |
				X509KeyStorageFlags.PersistKeySet |
				X509KeyStorageFlags.Exportable;
			return new X509Certificate2(file, password, storeFlags);
		}

		/// <summary>
		/// Generate a new certificate key and put it in the file at <paramref name="file"/>.
		/// </summary>
		/// <param name="file">The path of the output file</param>
		/// <param name="password">The password of the new certificate</param>
		/// <returns>The generated certificate</returns>
		private static X509Certificate2 _GenerateCertificate(string file, string password)
		{
			SecureRandom random = new();

			X509V3CertificateGenerator certificateGenerator = new();
			certificateGenerator.SetSerialNumber(BigIntegers.CreateRandomInRange(BigInteger.One,
				BigInteger.ValueOf(long.MaxValue), random));
			certificateGenerator.SetIssuerDN(new X509Name($"C=NL, O=SDG, CN=Kyoo"));
			certificateGenerator.SetSubjectDN(new X509Name($"C=NL, O=SDG, CN=Kyoo"));
			certificateGenerator.SetNotBefore(DateTime.UtcNow.Date);
			certificateGenerator.SetNotAfter(DateTime.UtcNow.Date.AddMonths(3));

			KeyGenerationParameters keyGenerationParameters = new(random, 2048);
			RsaKeyPairGenerator keyPairGenerator = new();
			keyPairGenerator.Init(keyGenerationParameters);

			AsymmetricCipherKeyPair subjectKeyPair = keyPairGenerator.GenerateKeyPair();
			certificateGenerator.SetPublicKey(subjectKeyPair.Public);

			const string signatureAlgorithm = "MD5WithRSA";
			Asn1SignatureFactory signatureFactory = new(signatureAlgorithm, subjectKeyPair.Private);
			X509Certificate bouncyCert = certificateGenerator.Generate(signatureFactory);

			Pkcs12Store store = new Pkcs12StoreBuilder().Build();
			store.SetKeyEntry("Kyoo_key", new AsymmetricKeyEntry(subjectKeyPair.Private), new[]
			{
				new X509CertificateEntry(bouncyCert)
			});

			using MemoryStream pfxStream = new();
			store.Save(pfxStream, password.ToCharArray(), random);
			X509Certificate2 certificate = new(pfxStream.ToArray(), password, X509KeyStorageFlags.Exportable);
			using FileStream fileStream = File.OpenWrite(file);
			pfxStream.WriteTo(fileStream);
			return certificate;
		}
	}
}
