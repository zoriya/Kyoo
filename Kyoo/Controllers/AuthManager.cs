using System;
using System.IO;
using System.Linq;
using System.Security.Claims;
using System.Security.Cryptography.X509Certificates;
using System.Threading.Tasks;
using IdentityServer4.Extensions;
using Microsoft.AspNetCore.Authorization;
using Microsoft.Extensions.Configuration;
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

namespace Kyoo.Controllers
{
	public static class AuthExtension
	{
		private const string CertificateFile = "certificate.pfx";
		private const string OldCertificateFile = "oldCertificate.pfx";

		public static IIdentityServerBuilder AddSigninKeys(this IIdentityServerBuilder builder, IConfiguration configuration)
		{
			X509Certificate2 certificate = GetSiginCredential(configuration);
			builder.AddSigningCredential(certificate);
			
			if (certificate.NotAfter.AddDays(7) <= DateTime.UtcNow)
			{
				Console.WriteLine("Signin certificate will expire soon, renewing it.");
				File.Move(CertificateFile, OldCertificateFile);
				builder.AddValidationKey(GenerateCertificate(CertificateFile, configuration.GetValue<string>("certificatePassword")));
			}
			else if (File.Exists(OldCertificateFile))
				builder.AddValidationKey(GetExistingCredential(OldCertificateFile, configuration.GetValue<string>("certificatePassword")));
			return builder;
		}

		private static X509Certificate2 GetSiginCredential(IConfiguration configuration)
		{
			if (File.Exists(CertificateFile))
				return GetExistingCredential(CertificateFile, configuration.GetValue<string>("certificatePassword"));
			return GenerateCertificate(CertificateFile, configuration.GetValue<string>("certificatePassword"));
		}

		private static X509Certificate2 GetExistingCredential(string file, string password)
		{
			return new X509Certificate2(file, password,
				X509KeyStorageFlags.MachineKeySet |
				X509KeyStorageFlags.PersistKeySet |
				X509KeyStorageFlags.Exportable
			);
		}

		private static X509Certificate2 GenerateCertificate(string file, string password)
		{
			SecureRandom random = new SecureRandom();
			
			X509V3CertificateGenerator certificateGenerator = new X509V3CertificateGenerator();
			certificateGenerator.SetSerialNumber(BigIntegers.CreateRandomInRange(BigInteger.One, BigInteger.ValueOf(Int64.MaxValue), random));
			certificateGenerator.SetIssuerDN(new X509Name($"C=NL, O=SDG, CN=Kyoo"));
			certificateGenerator.SetSubjectDN(new X509Name($"C=NL, O=SDG, CN=Kyoo"));
			certificateGenerator.SetNotBefore(DateTime.UtcNow.Date);
			certificateGenerator.SetNotAfter(DateTime.UtcNow.Date.AddMonths(3));
 
			KeyGenerationParameters keyGenerationParameters = new KeyGenerationParameters(random, 2048);
			RsaKeyPairGenerator keyPairGenerator = new RsaKeyPairGenerator();
			keyPairGenerator.Init(keyGenerationParameters);
 
			AsymmetricCipherKeyPair subjectKeyPair = keyPairGenerator.GenerateKeyPair();
			certificateGenerator.SetPublicKey(subjectKeyPair.Public);
 
			AsymmetricCipherKeyPair issuerKeyPair = subjectKeyPair;
			const string signatureAlgorithm = "MD5WithRSA";
			Asn1SignatureFactory signatureFactory = new Asn1SignatureFactory(signatureAlgorithm, issuerKeyPair.Private);
			X509Certificate bouncyCert = certificateGenerator.Generate(signatureFactory);
 
			X509Certificate2 certificate;
 
			Pkcs12Store store = new Pkcs12StoreBuilder().Build();
			store.SetKeyEntry("Kyoo_key", new AsymmetricKeyEntry(subjectKeyPair.Private), new [] {new X509CertificateEntry(bouncyCert)});
 
			using (MemoryStream pfxStream = new MemoryStream())
			{
				store.Save(pfxStream, password.ToCharArray(), random);
				certificate = new X509Certificate2(pfxStream.ToArray(), password, X509KeyStorageFlags.Exportable);
				using FileStream fileStream = File.OpenWrite(file);
				pfxStream.WriteTo(fileStream);
			}
			return certificate;
		}
	}
	
	public class AuthorizationValidatorHandler : AuthorizationHandler<AuthorizationValidator>
	{
		private readonly IConfiguration _configuration;
		
		public AuthorizationValidatorHandler(IConfiguration configuration)
		{
			_configuration = configuration;
		}
		
		protected override Task HandleRequirementAsync(AuthorizationHandlerContext context, AuthorizationValidator requirement)
		{
			if (!context.User.IsAuthenticated())
			{
				string defaultPerms = _configuration.GetValue<string>("defaultPermissions");
				if (defaultPerms.Split(',').Contains(requirement.Permission.ToLower()))
					context.Succeed(requirement);
			}
			else
			{
				Claim perms = context.User.Claims.FirstOrDefault(x => x.Type == "permissions");
				if (perms != null && perms.Value.Split(",").Contains(requirement.Permission.ToLower()))
					context.Succeed(requirement);
			}

			return Task.CompletedTask;
		}
	}

	public class AuthorizationValidator : IAuthorizationRequirement
	{
		public string Permission;

		public AuthorizationValidator(string permission)
		{
			Permission = permission;
		}
	}
}