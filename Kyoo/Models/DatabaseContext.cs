using System;
using System.Linq;
using System.Threading;
using System.Threading.Tasks;
using Kyoo.Models;
using Kyoo.Models.Exceptions;
using Microsoft.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore.ChangeTracking;
using Npgsql;

namespace Kyoo
{
	public class DatabaseContext : DbContext
	{
		public DatabaseContext(DbContextOptions<DatabaseContext> options) : base(options)
		{
			ChangeTracker.QueryTrackingBehavior = QueryTrackingBehavior.NoTracking;
			ChangeTracker.LazyLoadingEnabled = false;
		}

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
		
		// TODO Many to many with UsingEntity for this.
		public DbSet<PeopleRole> PeopleRoles { get; set; }
		

		public DatabaseContext()
		{
			NpgsqlConnection.GlobalTypeMapper.MapEnum<Status>();
			NpgsqlConnection.GlobalTypeMapper.MapEnum<ItemType>();
			NpgsqlConnection.GlobalTypeMapper.MapEnum<StreamType>();

			ChangeTracker.QueryTrackingBehavior = QueryTrackingBehavior.NoTracking;
			ChangeTracker.LazyLoadingEnabled = false;
		}

		protected override void OnModelCreating(ModelBuilder modelBuilder)
		{
			base.OnModelCreating(modelBuilder);

			modelBuilder.HasPostgresEnum<Status>();
			modelBuilder.HasPostgresEnum<ItemType>();
			modelBuilder.HasPostgresEnum<StreamType>();

			modelBuilder.Entity<Library>()
				.Property(x => x.Paths)
				.HasColumnType("text[]");

			modelBuilder.Entity<Show>()
				.Property(x => x.Aliases)
				.HasColumnType("text[]");

			modelBuilder.Entity<Track>()
				.Property(t => t.IsDefault)
				.ValueGeneratedNever();
			
			modelBuilder.Entity<Track>()
				.Property(t => t.IsForced)
				.ValueGeneratedNever();

			modelBuilder.Entity<ProviderID>()
				.HasMany(x => x.Libraries)
				.WithMany(x => x.Providers)
				.UsingEntity<Link<Library, ProviderID>>(
					y => y
						.HasOne(x => x.First)
						.WithMany(x => x.ProviderLinks),
					y => y
						.HasOne(x => x.Second)
						.WithMany(x => x.LibraryLinks),
					y => y.HasKey(Link<Library, ProviderID>.PrimaryKey));
			
			modelBuilder.Entity<Collection>()
				.HasMany(x => x.Libraries)
				.WithMany(x => x.Collections)
				.UsingEntity<Link<Library, Collection>>(
					y => y
						.HasOne(x => x.First)
						.WithMany(x => x.CollectionLinks),
					y => y
						.HasOne(x => x.Second)
						.WithMany(x => x.LibraryLinks),
					y => y.HasKey(Link<Library, Collection>.PrimaryKey));
			
			modelBuilder.Entity<Show>()
				.HasMany(x => x.Libraries)
				.WithMany(x => x.Shows)
				.UsingEntity<Link<Library, Show>>(
					y => y
						.HasOne(x => x.First)
						.WithMany(x => x.ShowLinks),
					y => y
						.HasOne(x => x.Second)
						.WithMany(x => x.LibraryLinks),
					y => y.HasKey(Link<Library, Show>.PrimaryKey));
			
			modelBuilder.Entity<Show>()
				.HasMany(x => x.Collections)
				.WithMany(x => x.Shows)
				.UsingEntity<Link<Collection, Show>>(
					y => y
						.HasOne(x => x.First)
						.WithMany(x => x.ShowLinks),
					y => y
						.HasOne(x => x.Second)
						.WithMany(x => x.CollectionLinks),
					y => y.HasKey(Link<Collection, Show>.PrimaryKey));
			
			modelBuilder.Entity<Genre>()
				.HasMany(x => x.Shows)
				.WithMany(x => x.Genres)
				.UsingEntity<Link<Show, Genre>>(
					y => y
						.HasOne(x => x.First)
						.WithMany(x => x.GenreLinks),
					y => y
						.HasOne(x => x.Second)
						.WithMany(x => x.ShowLinks),
					y => y.HasKey(Link<Show, Genre>.PrimaryKey));
			

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
			modelBuilder.Entity<MetadataID>()
				.HasOne(x => x.Provider)
				.WithMany(x => x.MetadataLinks)
				.OnDelete(DeleteBehavior.Cascade);

			modelBuilder.Entity<Collection>().Property(x => x.Slug).IsRequired();
			modelBuilder.Entity<Genre>().Property(x => x.Slug).IsRequired();
			modelBuilder.Entity<Library>().Property(x => x.Slug).IsRequired();
			modelBuilder.Entity<People>().Property(x => x.Slug).IsRequired();
			modelBuilder.Entity<ProviderID>().Property(x => x.Slug).IsRequired();
			modelBuilder.Entity<Show>().Property(x => x.Slug).IsRequired();
			modelBuilder.Entity<Studio>().Property(x => x.Slug).IsRequired();

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
		}

		public T GetTemporaryObject<T>(T model)
			where T : class, IResource
		{
			T tmp = Set<T>().Local.FirstOrDefault(x => x.ID == model.ID);
			if (tmp != null)
				return tmp;
			Entry(model).State = EntityState.Unchanged;
			return model;
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
			CancellationToken cancellationToken = new())
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

		public override async Task<int> SaveChangesAsync(CancellationToken cancellationToken = new())
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
			CancellationToken cancellationToken = new())
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

		public async Task<int> SaveIfNoDuplicates(CancellationToken cancellationToken = new())
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

		private static bool IsDuplicateException(Exception ex)
		{
			return ex.InnerException is PostgresException {SqlState: PostgresErrorCodes.UniqueViolation};
		}

		private void DiscardChanges()
		{
			foreach (EntityEntry entry in ChangeTracker.Entries().Where(x => x.State != EntityState.Unchanged
			                                                                 && x.State != EntityState.Detached))
			{
				entry.State = EntityState.Detached;
			}
		}
	}
}