using System;
using System.Linq;
using System.Threading.Tasks;
using IdentityServer4.EntityFramework.Entities;
using IdentityServer4.EntityFramework.Extensions;
using IdentityServer4.EntityFramework.Interfaces;
using IdentityServer4.EntityFramework.Options;
using Kyoo.Models;
using Microsoft.AspNetCore.Identity;
using Microsoft.AspNetCore.Identity.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore.ChangeTracking;
using Microsoft.EntityFrameworkCore.Storage.ValueConversion;
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

	public class DatabaseFactory
	{
		private readonly DbContextOptions<DatabaseContext> _options;
		
		public DatabaseFactory(DbContextOptions<DatabaseContext> options)
		{
			_options = options;
		}

		public DatabaseContext NewDatabaseConnection()
		{
			return new DatabaseContext(_options);
		}
	}

	public class DatabaseContext : DbContext
	{
		public DatabaseContext(DbContextOptions<DatabaseContext> options) : base(options) { }

		public DbSet<Library> Libraries { get; set; }
		public DbSet<Collection> Collections { get; set; }
		public DbSet<Show> Shows { get; set; }
		public DbSet<Season> Seasons { get; set; }
		public DbSet<Episode> Episodes { get; set; }
		public DbSet<Track> Tracks { get; set; }
		public DbSet<Genre> Genres { get; set; }
		public DbSet<People> Peoples { get; set; }
		public DbSet<Studio> Studios { get; set; }
		public DbSet<ProviderID> ProviderIds { get; set; }
		public DbSet<MetadataID> MetadataIds { get; set; }
		
		public DbSet<LibraryLink> LibraryLinks { get; set; }
		public DbSet<CollectionLink> CollectionLinks { get; set; }
		public DbSet<PeopleLink> PeopleLinks { get; set; }
		
		// This is used because EF doesn't support Many-To-Many relationships so for now we need to override the getter/setters to store this.
		public DbSet<GenreLink> GenreLinks { get; set; }
		public DbSet<ProviderLink> ProviderLinks { get; set; }
		
		
		private ValueConverter<string[], string> stringArrayConverter = new ValueConverter<string[], string>(
			arr => string.Join("|", arr),
			str => str.Split("|", StringSplitOptions.None));

		private ValueComparer<string[]> stringArrayComparer = new ValueComparer<string[]>(
			(l1, l2) => l1.SequenceEqual(l2),
			arr => arr.Aggregate(0, (i, s) => s.GetHashCode()));
		

		protected override void OnModelCreating(ModelBuilder modelBuilder)
		{
			base.OnModelCreating(modelBuilder);

			modelBuilder.Entity<Library>().Property(e => e.Paths).HasConversion(stringArrayConverter).Metadata.SetValueComparer(stringArrayComparer);
			modelBuilder.Entity<Show>().Property(e => e.Aliases).HasConversion(stringArrayConverter).Metadata.SetValueComparer(stringArrayComparer);

			modelBuilder.Entity<Track>()
				.Property(t => t.IsDefault)
				.ValueGeneratedNever();
			
			modelBuilder.Entity<Track>()
				.Property(t => t.IsForced)
				.ValueGeneratedNever();
			
			modelBuilder.Entity<People>()
				.HasKey(x => x.Slug);

			modelBuilder.Entity<GenreLink>()
				.HasKey(x => new {x.ShowID, x.GenreID});
							
			modelBuilder.Entity<Show>()
				.Ignore(x => x.Genres);
			
			modelBuilder.Entity<PeopleLink>()
				.Ignore(x => x.Slug);
			modelBuilder.Entity<PeopleLink>()
				.Ignore(x => x.Name);
			modelBuilder.Entity<PeopleLink>()
				.Ignore(x => x.ExternalIDs);


			modelBuilder.Entity<Collection>()
				.HasIndex(x => x.Slug)
				.IsUnique();
			modelBuilder.Entity<Genre>()
				.HasIndex(x => x.Slug)
				.IsUnique();
			modelBuilder.Entity<Library>()
				.HasIndex(x => x.Slug)
				.IsUnique();
			modelBuilder.Entity<People>()
				.HasIndex(x => x.Slug)
				.IsUnique();
			modelBuilder.Entity<Show>()
				.HasIndex(x => x.Slug)
				.IsUnique();
			modelBuilder.Entity<Studio>()
				.HasIndex(x => x.Slug)
				.IsUnique();
		}
	}
}

public static class DbSetExtension
{
	public static EntityEntry<T> AddIfNotExist<T>(this DbSet<T> db, T entity, Func<T, bool> predicate) where T : class
	{
		bool exists = db.Any(predicate);
		return exists ? null : db.Add(entity);
	}
}