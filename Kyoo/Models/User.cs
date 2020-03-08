using System;
using IdentityModel;
using Microsoft.AspNetCore.Identity;

namespace Kyoo.Models
{
	public class User : IdentityUser
	{
		public string OTAC { get; set; }
		public DateTime? OTACExpires { get; set; }
		
		public string GenerateOTAC(TimeSpan validFor)
		{
			string otac = CryptoRandom.CreateUniqueId();
			string hashed = otac; // TODO should add a good hashing here.
			
			OTAC = hashed;
			OTACExpires = DateTime.UtcNow.Add(validFor);
			return otac;
		}
	}
}