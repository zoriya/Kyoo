using System;
using System.Collections.Generic;
using System.Linq;
using System.Threading;
using System.Threading.Tasks;
using IdentityServer4.EntityFramework.Entities;
using IdentityServer4.EntityFramework.Extensions;
using IdentityServer4.EntityFramework.Interfaces;
using IdentityServer4.EntityFramework.Options;
using Kyoo.Models;
using Kyoo.Models.Exceptions;
using Kyoo.Models.Watch;
using Microsoft.AspNetCore.Identity;
using Microsoft.AspNetCore.Identity.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore.ChangeTracking;
using Microsoft.EntityFrameworkCore.Storage.ValueConversion;
using Microsoft.Extensions.Options;
using Npgsql;

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
		public DbSet<People> People { get; set; }
		public DbSet<Studio> Studios { get; set; }
		public DbSet<ProviderID> Providers { get; set; }
		public DbSet<MetadataID> MetadataIds { get; set; }
		
		public DbSet<PeopleLink> PeopleRoles { get; set; }
		
		
		// This is used because EF doesn't support Many-To-Many relationships so for now we need to override the getter/setters to store this.
		public DbSet<LibraryLink> LibraryLinks { get; set; }
		public DbSet<CollectionLink> CollectionLinks { get; set; }
		public DbSet<GenreLink> GenreLinks { get; set; }
		public DbSet<ProviderLink> ProviderLinks { get; set; }

		public DatabaseContext()
		{
			NpgsqlConnection.GlobalTypeMapper.MapEnum<Status>();
			NpgsqlConnection.GlobalTypeMapper.MapEnum<ItemType>();
			NpgsqlConnection.GlobalTypeMapper.MapEnum<StreamType>();
		}
		
		private readonly ValueComparer<IEnumerable<string>> _stringArrayComparer = 
			new ValueComparer<IEnumerable<string>>(
				(l1, l2) => l1.SequenceEqual(l2),
				arr => arr.Aggregate(0, (i, s) => s.GetHashCode()));

		protected override void OnModelCreating(ModelBuilder modelBuilder)
		{
			base.OnModelCreating(modelBuilder);

			modelBuilder.HasPostgresEnum<Status>();
			modelBuilder.HasPostgresEnum<ItemType>();
			modelBuilder.HasPostgresEnum<StreamType>();

			modelBuilder.Entity<Library>()
				.Property(x => x.Paths)
				.HasColumnType("text[]")
				.Metadata.SetValueComparer(_stringArrayComparer);

			modelBuilder.Entity<Show>()
				.Property(x => x.Aliases)
				.HasColumnType("text[]")
				.Metadata.SetValueComparer(_stringArrayComparer);
			
			
			modelBuilder.Entity<Track>()
				.Property(t => t.IsDefault)
				.ValueGeneratedNever();
			
			modelBuilder.Entity<Track>()
				.Property(t => t.IsForced)
				.ValueGeneratedNever();

			modelBuilder.Entity<GenreLink>()
				.HasKey(x => new {x.ShowID, x.GenreID});

			modelBuilder.Entity<Library>()
				.Ignore(x => x.Shows)
				.Ignore(x => x.Collections)
				.Ignore(x => x.Providers);
			
			modelBuilder.Entity<Collection>()
				.Ignore(x => x.Shows)
				.Ignore(x => x.Libraries);
			
			modelBuilder.Entity<Show>()
				.Ignore(x => x.Genres)
				.Ignore(x => x.Libraries)
				.Ignore(x => x.Collections);

			modelBuilder.Entity<PeopleLink>()
				.Ignore(x => x.Slug)
				.Ignore(x => x.Name)
				.Ignore(x => x.Poster)
				.Ignore(x => x.ExternalIDs);

			modelBuilder.Entity<Genre>()
				.Ignore(x => x.Shows);

			
			modelBuilder.Entity<MetadataID>()
				.HasOne(x => x.Show)
				.WithMany(x => x.ExternalIDs)
				.OnDelete(DeleteBehavior.Cascade);
			modelBuilder.Entity<MetadataID>()
				.HasOne(x => x.Season)
				.WithMany(x => x.ExternalIDs)
				.OnDelete(DeleteBehavior.Cascade);
			modelBuilder.Entity<MetadataID>()
				.HasOne(x => x.Episode)
				.WithMany(x => x.ExternalIDs)
				.OnDelete(DeleteBehavior.Cascade);
			modelBuilder.Entity<MetadataID>()
				.HasOne(x => x.People)
				.WithMany(x => x.ExternalIDs)
				.OnDelete(DeleteBehavior.Cascade);


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
			modelBuilder.Entity<ProviderID>()
				.HasIndex(x => x.Slug)
				.IsUnique();
			modelBuilder.Entity<Season>()
				.HasIndex(x => new {x.ShowID, x.SeasonNumber})
				.IsUnique();
			modelBuilder.Entity<Episode>()
				.HasIndex(x => new {x.ShowID, x.SeasonNumber, x.EpisodeNumber, x.AbsoluteNumber})
				.IsUnique();
			modelBuilder.Entity<LibraryLink>()
				.HasIndex(x => new {x.LibraryID, x.ShowID})
				.IsUnique();
			modelBuilder.Entity<LibraryLink>()
				.HasIndex(x => new {x.LibraryID, x.CollectionID})
				.IsUnique();
			modelBuilder.Entity<CollectionLink>()
				.HasIndex(x => new {x.CollectionID, x.ShowID})
				.IsUnique();
		}

		public override int SaveChanges()
		{
			try
			{
				return base.SaveChanges();
			}
			catch (DbUpdateException ex)
			{
				DiscardChanges();
				if (IsDuplicateException(ex))
					throw new DuplicatedItemException();
				throw;
			}
		}

		public override int SaveChanges(bool acceptAllChangesOnSuccess)
		{
			try
			{
				return base.SaveChanges(acceptAllChangesOnSuccess);
			}
			catch (DbUpdateException ex)
			{
				DiscardChanges();
				if (IsDuplicateException(ex))
					throw new DuplicatedItemException();
				throw;
			}
		}
		
		public int SaveChanges(string duplicateMessage)
		{
			try
			{
				return base.SaveChanges();
			}
			catch (DbUpdateException ex)
			{
				DiscardChanges();
				if (IsDuplicateException(ex))
					throw new DuplicatedItemException(duplicateMessage);
				throw;
			}
		}

		public override async Task<int> SaveChangesAsync(bool acceptAllChangesOnSuccess, 
			CancellationToken cancellationToken = new CancellationToken())
		{
			try
			{
				return await base.SaveChangesAsync(acceptAllChangesOnSuccess, cancellationToken);
			}
			catch (DbUpdateException ex)
			{
				DiscardChanges();
				if (IsDuplicateException(ex))
					throw new DuplicatedItemException();
				throw;
			}
		}

		public override async Task<int> SaveChangesAsync(CancellationToken cancellationToken = new CancellationToken())
		{
			try
			{
				return await base.SaveChangesAsync(cancellationToken);
			}
			catch (DbUpdateException ex)
			{
				DiscardChanges();
				if (IsDuplicateException(ex))
					throw new DuplicatedItemException();
				throw;
			}
		}
		
		public async Task<int> SaveChangesAsync(string duplicateMessage,
			CancellationToken cancellationToken = new CancellationToken())
		{
			try
			{
				return await base.SaveChangesAsync(cancellationToken);
			}
			catch (DbUpdateException ex)
			{
				DiscardChanges();
				if (IsDuplicateException(ex))
					throw new DuplicatedItemException(duplicateMessage);
				throw;
			}
		}

		public async Task<int> SaveIfNoDuplicates(CancellationToken cancellationToken = new CancellationToken())
		{
			try
			{
				return await SaveChangesAsync(cancellationToken);
			}
			catch (DuplicatedItemException)
			{
				return -1;
			}
		}

		public static bool IsDuplicateException(DbUpdateException ex)
		{
			return ex.InnerException is PostgresException inner
			       && inner.SqlState == PostgresErrorCodes.UniqueViolation;
		}

		public void DiscardChanges()
		{
			foreach (EntityEntry entry in ChangeTracker.Entries().Where(x => x.State != EntityState.Unchanged
			                                                                 && x.State != EntityState.Detached))
			{
				entry.State = EntityState.Detached;
			}
		}
	}
}