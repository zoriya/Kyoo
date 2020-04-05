using System;
using System.IO;
using System.Linq;
using System.Security.Claims;
using System.Security.Cryptography.X509Certificates;
using System.Threading.Tasks;
using IdentityServer4.Extensions;
using Microsoft.AspNetCore.Authorization;
using Microsoft.Extensions.Configuration;
using Org.BouncyCastle.Asn1.X509;
using Org.BouncyCastle.Crypto;
using Org.BouncyCastle.Crypto.Generators;
using Org.BouncyCastle.Crypto.Operators;
using Org.BouncyCastle.Crypto.Prng;
using Org.BouncyCastle.Math;
using Org.BouncyCastle.Pkcs;
using Org.BouncyCastle.Security;
using Org.BouncyCastle.Utilities;
using Org.BouncyCastle.X509;
using X509Certificate = Org.BouncyCastle.X509.X509Certificate;

namespace Kyoo.Controllers
{
	public class AuthManager
	{
		public const string CertificateFile = "certificate.pfx";

		public static X509Certificate2 GetSiginCredential(IConfiguration configuration)
		{
			if (File.Exists(CertificateFile))
			{
				return new X509Certificate2(CertificateFile, configuration.GetValue<string>("certificatePassword"),
					X509KeyStorageFlags.MachineKeySet |
					X509KeyStorageFlags.PersistKeySet |
					X509KeyStorageFlags.Exportable
				);
			}

			SecureRandom random = new SecureRandom();
			
            X509V3CertificateGenerator certificateGenerator = new X509V3CertificateGenerator();
            certificateGenerator.SetSerialNumber(BigIntegers.CreateRandomInRange(BigInteger.One, BigInteger.ValueOf(Int64.MaxValue), random));
            certificateGenerator.SetIssuerDN(new X509Name($"C=NL, O=SDG, CN=Kyoo"));
            certificateGenerator.SetSubjectDN(new X509Name($"C=NL, O=SDG, CN=Kyoo"));
            certificateGenerator.SetNotBefore(DateTime.UtcNow.Date);
            certificateGenerator.SetNotAfter(DateTime.UtcNow.Date.AddYears(1));
 
            KeyGenerationParameters keyGenerationParameters = new KeyGenerationParameters(random, 2048);
            RsaKeyPairGenerator keyPairGenerator = new RsaKeyPairGenerator();
            keyPairGenerator.Init(keyGenerationParameters);
 
            AsymmetricCipherKeyPair subjectKeyPair = keyPairGenerator.GenerateKeyPair();
            certificateGenerator.SetPublicKey(subjectKeyPair.Public);
 
            AsymmetricCipherKeyPair issuerKeyPair = subjectKeyPair;
            const string signatureAlgorithm = "SHA256WithRSA";
            Asn1SignatureFactory signatureFactory = new Asn1SignatureFactory(signatureAlgorithm,issuerKeyPair.Private);
            X509Certificate bouncyCert = certificateGenerator.Generate(signatureFactory);
 
            X509Certificate2 certificate;
 
            Pkcs12Store store = new Pkcs12StoreBuilder().Build();
            store.SetKeyEntry("Kyoo_key", new AsymmetricKeyEntry(subjectKeyPair.Private), new [] {new X509CertificateEntry(bouncyCert)});
            string pass = configuration.GetValue<string>("certificatePassword"); //Guid.NewGuid().ToString("x");
 
            using (MemoryStream pfxStream = new MemoryStream())
            {
                store.Save(pfxStream, pass.ToCharArray(), random);
                certificate = new X509Certificate2(pfxStream.ToArray(), pass, X509KeyStorageFlags.Exportable);
                using (FileStream fileStream = File.OpenWrite(CertificateFile))
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