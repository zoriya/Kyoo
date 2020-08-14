using System.Threading.Tasks;
using IdentityServer4.EntityFramework.Entities;
using IdentityServer4.EntityFramework.Extensions;
using IdentityServer4.EntityFramework.Interfaces;
using IdentityServer4.EntityFramework.Options;
using Kyoo.Models;
using Microsoft.AspNetCore.Identity;
using Microsoft.AspNetCore.Identity.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.Options;

namespace Kyoo
{
	public class IdentityDatabase : IdentityDbContext<User>, IPersistedGrantDbContext
	{
		private readonly IOptions<OperationalStoreOptions> _operationalStoreOptions;

		public IdentityDatabase(DbContextOptions<IdentityDatabase> options, IOptions<OperationalStoreOptions> operationalStoreOptions)
			: base(options)
		{
			_operationalStoreOptions = operationalStoreOptions;
		}

		public DbSet<User> Accounts { get; set; }
		
		protected override void OnModelCreating(ModelBuilder modelBuilder)
		{
			base.OnModelCreating(modelBuilder);
			modelBuilder.ConfigurePersistedGrantContext(_operationalStoreOptions.Value);
			
			modelBuilder.Entity<User>().ToTable("User");
			modelBuilder.Entity<IdentityUserRole<string>>().ToTable("UserRole");
			modelBuilder.Entity<IdentityUserLogin<string>>().ToTable("UserLogin");
			modelBuilder.Entity<IdentityUserClaim<string>>().ToTable("UserClaim");
			modelBuilder.Entity<IdentityRole>().ToTable("UserRoles");
			modelBuilder.Entity<IdentityRoleClaim<string>>().ToTable("UserRoleClaim");
			modelBuilder.Entity<IdentityUserToken<string>>().ToTable("UserToken");
		}

		public Task<int> SaveChangesAsync() => base.SaveChangesAsync();

		public DbSet<PersistedGrant> PersistedGrants { get; set; }
		public DbSet<DeviceFlowCodes> DeviceFlowCodes { get; set; }

	}
}