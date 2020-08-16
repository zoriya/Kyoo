using System.Collections.Generic;
using System.Linq;
using System.Threading;
using System.Threading.Tasks;
using Kyoo.Models;
using Kyoo.Models.Exceptions;
using Kyoo.Models.Watch;
using Microsoft.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore.ChangeTracking;
using Npgsql;

namespace Kyoo
{
	public class DatabaseContext : DbContext
	{
		public DatabaseContext(DbContextOptions<DatabaseContext> options) : base(options) { }

		public DbSet<LibraryDE> Libraries { get; set; }
		public DbSet<CollectionDE> Collections { get; set; }
		public DbSet<ShowDE> Shows { get; set; }
		public DbSet<Season> Seasons { get; set; }
		public DbSet<Episode> Episodes { get; set; }
		public DbSet<Track> Tracks { get; set; }
		public DbSet<GenreDE> Genres { get; set; }
		public DbSet<People> People { get; set; }
		public DbSet<Studio> Studios { get; set; }
		public DbSet<ProviderID> Providers { get; set; }
		public DbSet<MetadataID> MetadataIds { get; set; }
		
		public DbSet<PeopleRole> PeopleRoles { get; set; }
		
		
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

			modelBuilder.Ignore<Library>();
			modelBuilder.Ignore<Collection>();
			modelBuilder.Ignore<Show>();
			modelBuilder.Ignore<Genre>();
				
			modelBuilder.Entity<LibraryDE>()
				.Property(x => x.Paths)
				.HasColumnType("text[]")
				.Metadata.SetValueComparer(_stringArrayComparer);

			modelBuilder.Entity<ShowDE>()
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

			modelBuilder.Entity<LibraryDE>()
				.Ignore(x => x.Shows)
				.Ignore(x => x.Collections)
				.Ignore(x => x.Providers);
			
			modelBuilder.Entity<CollectionDE>()
				.Ignore(x => x.Shows)
				.Ignore(x => x.Libraries);
			
			modelBuilder.Entity<ShowDE>()
				.Ignore(x => x.Genres)
				.Ignore(x => x.Libraries)
				.Ignore(x => x.Collections);

			modelBuilder.Entity<PeopleRole>()
				.Ignore(x => x.Slug)
				.Ignore(x => x.Name)
				.Ignore(x => x.Poster)
				.Ignore(x => x.ExternalIDs);

			modelBuilder.Entity<GenreDE>()
				.Ignore(x => x.Shows);
			

			modelBuilder.Entity<LibraryLink>()
				.HasOne(x => x.Library as LibraryDE)
				.WithMany(x => x.Links)
				.OnDelete(DeleteBehavior.Cascade);
			modelBuilder.Entity<LibraryLink>()
				.HasOne(x => x.Show as ShowDE)
				.WithMany(x => x.LibraryLinks)
				.OnDelete(DeleteBehavior.Cascade);
			modelBuilder.Entity<LibraryLink>()
				.HasOne(x => x.Collection as CollectionDE)
				.WithMany(x => x.LibraryLinks)
				.OnDelete(DeleteBehavior.Cascade);
			
			modelBuilder.Entity<CollectionLink>()
				.HasOne(x => x.Collection as CollectionDE)
				.WithMany(x => x.Links)
				.OnDelete(DeleteBehavior.Cascade);
			modelBuilder.Entity<CollectionLink>()
				.HasOne(x => x.Show as ShowDE)
				.WithMany(x => x.CollectionLinks)
				.OnDelete(DeleteBehavior.Cascade);
			
			modelBuilder.Entity<GenreLink>()
				.HasOne(x => x.Genre as GenreDE)
				.WithMany(x => x.Links)
				.OnDelete(DeleteBehavior.Cascade);
			modelBuilder.Entity<GenreLink>()
				.HasOne(x => x.Show as ShowDE)
				.WithMany(x => x.GenreLinks)
				.OnDelete(DeleteBehavior.Cascade);

			modelBuilder.Entity<ProviderLink>()
				.HasOne(x => x.Library as LibraryDE)
				.WithMany(x => x.ProviderLinks)
				.OnDelete(DeleteBehavior.Cascade);

			modelBuilder.Entity<Season>()
				.HasOne(x => x.Show as ShowDE)
				.WithMany(x => x.Seasons);
			modelBuilder.Entity<Episode>()
				.HasOne(x => x.Show as ShowDE)
				.WithMany(x => x.Episodes);
			modelBuilder.Entity<PeopleRole>()
				.HasOne(x => x.Show as ShowDE)
				.WithMany(x => x.People);
			
			

			modelBuilder.Entity<MetadataID>()
				.HasOne(x => x.Show as ShowDE)
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

			modelBuilder.Entity<CollectionDE>().Property(x => x.Slug).IsRequired();
			modelBuilder.Entity<GenreDE>().Property(x => x.Slug).IsRequired();
			modelBuilder.Entity<LibraryDE>().Property(x => x.Slug).IsRequired();
			modelBuilder.Entity<People>().Property(x => x.Slug).IsRequired();
			modelBuilder.Entity<ProviderID>().Property(x => x.Slug).IsRequired();
			modelBuilder.Entity<ShowDE>().Property(x => x.Slug).IsRequired();
			modelBuilder.Entity<Studio>().Property(x => x.Slug).IsRequired();

			modelBuilder.Entity<CollectionDE>()
				.HasIndex(x => x.Slug)
				.IsUnique();
			modelBuilder.Entity<GenreDE>()
				.HasIndex(x => x.Slug)
				.IsUnique();
			modelBuilder.Entity<LibraryDE>()
				.HasIndex(x => x.Slug)
				.IsUnique();
			modelBuilder.Entity<People>()
				.HasIndex(x => x.Slug)
				.IsUnique();
			modelBuilder.Entity<ShowDE>()
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