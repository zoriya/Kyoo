using System;
using System.Linq;
using System.Threading;
using System.Threading.Tasks;
using Kyoo.Controllers;
using Kyoo.Models;
using Kyoo.Models.Exceptions;
using Microsoft.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore.ChangeTracking;

namespace Kyoo
{
	/// <summary>
	/// The database handle used for all local repositories.
	/// This is an abstract class. It is meant to be implemented by plugins. This allow the core to be database agnostic.
	/// </summary>
	/// <remarks>
	/// It should not be used directly, to access the database use a <see cref="ILibraryManager"/> or repositories.
	/// </remarks>
	public abstract class DatabaseContext : DbContext
	{
		/// <summary>
		/// All libraries of Kyoo. See <see cref="Library"/>.
		/// </summary>
		public DbSet<Library> Libraries { get; set; }
		/// <summary>
		/// All collections of Kyoo. See <see cref="Collection"/>.
		/// </summary>
		public DbSet<Collection> Collections { get; set; }
		/// <summary>
		/// All shows of Kyoo. See <see cref="Show"/>.
		/// </summary>
		public DbSet<Show> Shows { get; set; }
		/// <summary>
		/// All seasons of Kyoo. See <see cref="Season"/>.
		/// </summary>
		public DbSet<Season> Seasons { get; set; }
		/// <summary>
		/// All episodes of Kyoo. See <see cref="Episode"/>.
		/// </summary>
		public DbSet<Episode> Episodes { get; set; }
		/// <summary>
		/// All tracks of Kyoo. See <see cref="Track"/>.
		/// </summary>
		public DbSet<Track> Tracks { get; set; }
		/// <summary>
		/// All genres of Kyoo. See <see cref="Genres"/>.
		/// </summary>
		public DbSet<Genre> Genres { get; set; }
		/// <summary>
		/// All people of Kyoo. See <see cref="People"/>.
		/// </summary>
		public DbSet<People> People { get; set; }
		/// <summary>
		/// All studios of Kyoo. See <see cref="Studio"/>.
		/// </summary>
		public DbSet<Studio> Studios { get; set; }
		/// <summary>
		/// All providers of Kyoo. See <see cref="Provider"/>.
		/// </summary>
		public DbSet<Provider> Providers { get; set; }
		/// <summary>
		/// All metadataIDs (ExternalIDs) of Kyoo. See <see cref="MetadataID"/>.
		/// </summary>
		public DbSet<MetadataID> MetadataIds { get; set; }
		
		/// <summary>
		/// All people's role. See <see cref="PeopleRole"/>.
		/// </summary>
		public DbSet<PeopleRole> PeopleRoles { get; set; }

		/// <summary>
		/// Get a generic link between two resource types.
		/// </summary>
		/// <remarks>Types are order dependant. You can't inverse the order. Please always put the owner first.</remarks>
		/// <typeparam name="T1">The first resource type of the relation. It is the owner of the second</typeparam>
		/// <typeparam name="T2">The second resource type of the relation. It is the contained resource.</typeparam>
		/// <returns>All links between the two types.</returns>
		public DbSet<Link<T1, T2>> Links<T1, T2>()
			where T1 : class, IResource
			where T2 : class, IResource
		{
			return Set<Link<T1, T2>>();
		}

		/// <summary>
		/// Set basic configurations (like preventing query tracking)
		/// </summary>
		/// <param name="optionsBuilder">An option builder to fill.</param>
		protected override void OnConfiguring(DbContextOptionsBuilder optionsBuilder)
		{
			base.OnConfiguring(optionsBuilder);
			optionsBuilder.UseQueryTrackingBehavior(QueryTrackingBehavior.NoTracking);
		}

		/// <summary>
		/// Set database parameters to support every types of Kyoo.
		/// </summary>
		/// <param name="modelBuilder">The database's model builder.</param>
		protected override void OnModelCreating(ModelBuilder modelBuilder)
		{
			base.OnModelCreating(modelBuilder);

			modelBuilder.Entity<Track>()
				.Property(t => t.IsDefault)
				.ValueGeneratedNever();
			
			modelBuilder.Entity<Track>()
				.Property(t => t.IsForced)
				.ValueGeneratedNever();

			modelBuilder.Entity<Provider>()
				.HasMany(x => x.Libraries)
				.WithMany(x => x.Providers)
				.UsingEntity<Link<Library, Provider>>(
					y => y
						.HasOne(x => x.First)
						.WithMany(x => x.ProviderLinks),
					y => y
						.HasOne(x => x.Second)
						.WithMany(x => x.LibraryLinks),
					y => y.HasKey(Link<Library, Provider>.PrimaryKey));
			
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
			modelBuilder.Entity<Provider>().Property(x => x.Slug).IsRequired();
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
			modelBuilder.Entity<Provider>()
				.HasIndex(x => x.Slug)
				.IsUnique();
			modelBuilder.Entity<Season>()
				.HasIndex(x => new {x.ShowID, x.SeasonNumber})
				.IsUnique();
			modelBuilder.Entity<Episode>()
				.HasIndex(x => new {x.ShowID, x.SeasonNumber, x.EpisodeNumber, x.AbsoluteNumber})
				.IsUnique();
			modelBuilder.Entity<Track>()
				.HasIndex(x => new {x.EpisodeID, x.Type, x.Language, x.TrackIndex, x.IsForced})
				.IsUnique();
		}

		/// <summary>
		/// Return a new or an in cache temporary object wih the same ID as the one given
		/// </summary>
		/// <param name="model">If a resource with the same ID is found in the database, it will be used.
		/// <see cref="model"/> will be used overwise</param>
		/// <typeparam name="T">The type of the resource</typeparam>
		/// <returns>A resource that is now tracked by this context.</returns>
		public T GetTemporaryObject<T>(T model)
			where T : class, IResource
		{
			T tmp = Set<T>().Local.FirstOrDefault(x => x.ID == model.ID);
			if (tmp != null)
				return tmp;
			Entry(model).State = EntityState.Unchanged;
			return model;
		}

		/// <summary>
		/// Save changes that are applied to this context.
		/// </summary>
		/// <exception cref="DuplicatedItemException">A duplicated item has been found.</exception>
		/// <returns>The number of state entries written to the database.</returns>
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

		/// <summary>
		/// Save changes that are applied to this context.
		/// </summary>
		/// <param name="acceptAllChangesOnSuccess">Indicates whether AcceptAllChanges() is called after the changes
		/// have been sent successfully to the database.</param>
		/// <exception cref="DuplicatedItemException">A duplicated item has been found.</exception>
		/// <returns>The number of state entries written to the database.</returns>
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
		
		/// <summary>
		/// Save changes that are applied to this context.
		/// </summary>
		/// <param name="duplicateMessage">The message that will have the <see cref="DuplicatedItemException"/>
		/// (if a duplicate is found).</param>
		/// <exception cref="DuplicatedItemException">A duplicated item has been found.</exception>
		/// <returns>The number of state entries written to the database.</returns>
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

		/// <summary>
		/// Save changes that are applied to this context.
		/// </summary>
		/// <param name="acceptAllChangesOnSuccess">Indicates whether AcceptAllChanges() is called after the changes
		/// have been sent successfully to the database.</param>
		/// <param name="cancellationToken">A <see cref="CancellationToken"/> to observe while waiting for the task to complete</param>
		/// <exception cref="DuplicatedItemException">A duplicated item has been found.</exception>
		/// <returns>The number of state entries written to the database.</returns>
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

		/// <summary>
		/// Save changes that are applied to this context.
		/// </summary>
		/// <param name="cancellationToken">A <see cref="CancellationToken"/> to observe while waiting for the task to complete</param>
		/// <exception cref="DuplicatedItemException">A duplicated item has been found.</exception>
		/// <returns>The number of state entries written to the database.</returns>
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
		
		/// <summary>
		/// Save changes that are applied to this context.
		/// </summary>
		/// <param name="duplicateMessage">The message that will have the <see cref="DuplicatedItemException"/>
		/// (if a duplicate is found).</param>
		/// <param name="cancellationToken">A <see cref="CancellationToken"/> to observe while waiting for the task to complete</param>
		/// <exception cref="DuplicatedItemException">A duplicated item has been found.</exception>
		/// <returns>The number of state entries written to the database.</returns>
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

		/// <summary>
		/// Save changes if no duplicates are found. If one is found, no change are saved but the current changes are no discarded.
		/// The current context will still hold those invalid changes.
		/// </summary>
		/// <param name="cancellationToken">A <see cref="CancellationToken"/> to observe while waiting for the task to complete</param>
		/// <returns>The number of state entries written to the database or -1 if a duplicate exist.</returns>
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

		/// <summary>
		/// Save items or retry with a custom method if a duplicate is found.
		/// </summary>
		/// <param name="obj">The item to save (other changes of this context will also be saved)</param>
		/// <param name="onFail">A function to run on fail, the <see cref="obj"/> param wil be mapped.
		/// The second parameter is the current retry number.</param>
		/// <param name="cancellationToken">A <see cref="CancellationToken"/> to observe while waiting for the task to complete</param>
		/// <typeparam name="T">The type of the item to save</typeparam>
		/// <returns>The number of state entries written to the database.</returns>
		public Task<T> SaveOrRetry<T>(T obj, Func<T, int, T> onFail, CancellationToken cancellationToken = new())
		{
			return SaveOrRetry(obj, onFail, 0, cancellationToken);
		}
		
		/// <summary>
		/// Save items or retry with a custom method if a duplicate is found.
		/// </summary>
		/// <param name="obj">The item to save (other changes of this context will also be saved)</param>
		/// <param name="onFail">A function to run on fail, the <see cref="obj"/> param wil be mapped.
		/// The second parameter is the current retry number.</param>
		/// <param name="recurse">The current retry number.</param>
		/// <param name="cancellationToken">A <see cref="CancellationToken"/> to observe while waiting for the task to complete</param>
		/// <typeparam name="T">The type of the item to save</typeparam>
		/// <returns>The number of state entries written to the database.</returns>
		private async Task<T> SaveOrRetry<T>(T obj,
			Func<T, int, T> onFail,
			int recurse,
			CancellationToken cancellationToken = new())
		{
			try
			{
				await base.SaveChangesAsync(true, cancellationToken);
				return obj;
			}
			catch (DbUpdateException ex) when (IsDuplicateException(ex))
			{
				recurse++;
				return await SaveOrRetry(onFail(obj, recurse), onFail, recurse, cancellationToken);
			}
			catch (DbUpdateException)
			{
				DiscardChanges();
				throw;
			}
		}

		/// <summary>
		/// Check if the exception is a duplicated exception.
		/// </summary>
		/// <param name="ex">The exception to check</param>
		/// <returns>True if the exception is a duplicate exception. False otherwise</returns>
		protected abstract bool IsDuplicateException(Exception ex);

		/// <summary>
		/// Delete every changes that are on this context.
		/// </summary>
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