// Kyoo - A portable and vast media library solution.
// Copyright (c) Kyoo.
//
// See AUTHORS.md and LICENSE file in the project root for full license information.
//
// Kyoo is free software: you can redistribute it and/or modify
// it under the terms of the GNU General Public License as published by
// the Free Software Foundation, either version 3 of the License, or
// any later version.
//
// Kyoo is distributed in the hope that it will be useful,
// but WITHOUT ANY WARRANTY; without even the implied warranty of
// MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE. See the
// GNU General Public License for more details.
//
// You should have received a copy of the GNU General Public License
// along with Kyoo. If not, see <https://www.gnu.org/licenses/>.

using System;
using System.Collections.Generic;
using System.Linq;
using System.Linq.Expressions;
using System.Threading;
using System.Threading.Tasks;
using JetBrains.Annotations;
using Kyoo.Abstractions.Controllers;
using Kyoo.Abstractions.Models;
using Kyoo.Abstractions.Models.Exceptions;
using Microsoft.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore.ChangeTracking;

namespace Kyoo.Database
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
		/// The list of registered users.
		/// </summary>
		public DbSet<User> Users { get; set; }

		/// <summary>
		/// All people's role. See <see cref="PeopleRole"/>.
		/// </summary>
		public DbSet<PeopleRole> PeopleRoles { get; set; }

		/// <summary>
		/// Episodes with a watch percentage. See <see cref="WatchedEpisode"/>.
		/// </summary>
		public DbSet<WatchedEpisode> WatchedEpisodes { get; set; }

		/// <summary>
		/// The list of library items (shows and collections that are part of a library - or the global one).
		/// </summary>
		/// <remarks>
		/// This set is ready only, on most database this will be a view.
		/// </remarks>
		public DbSet<LibraryItem> LibraryItems { get; set; }

		/// <summary>
		/// Get all metadataIDs (ExternalIDs) of a given resource. See <see cref="MetadataID"/>.
		/// </summary>
		/// <typeparam name="T">The metadata of this type will be returned.</typeparam>
		/// <returns>A queryable of metadata ids for a type.</returns>
		public DbSet<MetadataID> MetadataIds<T>()
			where T : class, IMetadata
		{
			return Set<MetadataID>(MetadataName<T>());
		}

		/// <summary>
		/// Add a many to many link between two resources.
		/// </summary>
		/// <remarks>Types are order dependant. You can't inverse the order. Please always put the owner first.</remarks>
		/// <param name="first">The ID of the first resource.</param>
		/// <param name="second">The ID of the second resource.</param>
		/// <typeparam name="T1">The first resource type of the relation. It is the owner of the second</typeparam>
		/// <typeparam name="T2">The second resource type of the relation. It is the contained resource.</typeparam>
		/// <returns>A <see cref="Task"/> representing the asynchronous operation.</returns>
		public async Task AddLinks<T1, T2>(int first, int second)
			where T1 : class, IResource
			where T2 : class, IResource
		{
			await Set<Dictionary<string, object>>(LinkName<T1, T2>())
				.AddAsync(new Dictionary<string, object>
				{
					[LinkNameFk<T1>()] = first,
					[LinkNameFk<T2>()] = second
				});
		}

		/// <summary>
		/// The default constructor
		/// </summary>
		protected DatabaseContext() { }

		/// <summary>
		/// Create a new <see cref="DatabaseContext"/> using specific options
		/// </summary>
		/// <param name="options">The options to use.</param>
		protected DatabaseContext(DbContextOptions options)
			: base(options)
		{ }

		/// <summary>
		/// Get the name of the metadata table of the given type.
		/// </summary>
		/// <typeparam name="T">The type related to the metadata</typeparam>
		/// <returns>The name of the table containing the metadata.</returns>
		protected abstract string MetadataName<T>()
			where T : IMetadata;

		/// <summary>
		/// Get the name of the link table of the two given types.
		/// </summary>
		/// <typeparam name="T">The owner type of the relation</typeparam>
		/// <typeparam name="T2">The child type of the relation</typeparam>
		/// <returns>The name of the table containing the links.</returns>
		protected abstract string LinkName<T, T2>()
			where T : IResource
			where T2 : IResource;

		/// <summary>
		/// Get the name of a link's foreign key.
		/// </summary>
		/// <typeparam name="T">The type that will be accessible via the navigation</typeparam>
		/// <returns>The name of the foreign key for the given resource.</returns>
		protected abstract string LinkNameFk<T>()
			where T : IResource;

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
		/// Build the metadata model for the given type.
		/// </summary>
		/// <param name="modelBuilder">The database model builder</param>
		/// <typeparam name="T">The type to add metadata to.</typeparam>
		private void _HasMetadata<T>(ModelBuilder modelBuilder)
			where T : class, IMetadata
		{
			modelBuilder.SharedTypeEntity<MetadataID>(MetadataName<T>())
				.HasKey(MetadataID.PrimaryKey);

			modelBuilder.SharedTypeEntity<MetadataID>(MetadataName<T>())
				.HasOne<T>()
				.WithMany(x => x.ExternalIDs)
				.HasForeignKey(x => x.ResourceID)
				.OnDelete(DeleteBehavior.Cascade);
		}

		/// <summary>
		/// Create a many to many relationship between the two entities.
		/// The resulting relationship will have an available <see cref="AddLinks{T1,T2}"/> method.
		/// </summary>
		/// <param name="modelBuilder">The database model builder</param>
		/// <param name="firstNavigation">The first navigation expression from T to T2</param>
		/// <param name="secondNavigation">The second navigation expression from T2 to T</param>
		/// <typeparam name="T">The owning type of the relationship</typeparam>
		/// <typeparam name="T2">The owned type of the relationship</typeparam>
		private void _HasManyToMany<T, T2>(ModelBuilder modelBuilder,
			Expression<Func<T, IEnumerable<T2>>> firstNavigation,
			Expression<Func<T2, IEnumerable<T>>> secondNavigation)
			where T : class, IResource
			where T2 : class, IResource
		{
			modelBuilder.Entity<T2>()
				.HasMany(secondNavigation)
				.WithMany(firstNavigation)
				.UsingEntity<Dictionary<string, object>>(
					LinkName<T, T2>(),
					x => x
						.HasOne<T>()
						.WithMany()
						.HasForeignKey(LinkNameFk<T>())
						.OnDelete(DeleteBehavior.Cascade),
					x => x
						.HasOne<T2>()
						.WithMany()
						.HasForeignKey(LinkNameFk<T2>())
						.OnDelete(DeleteBehavior.Cascade)
				);
		}

		/// <summary>
		/// Set database parameters to support every types of Kyoo.
		/// </summary>
		/// <param name="modelBuilder">The database's model builder.</param>
		protected override void OnModelCreating(ModelBuilder modelBuilder)
		{
			base.OnModelCreating(modelBuilder);

			modelBuilder.Entity<PeopleRole>()
				.Ignore(x => x.ForPeople);

			modelBuilder.Entity<Show>()
				.HasMany(x => x.Seasons)
				.WithOne(x => x.Show)
				.OnDelete(DeleteBehavior.Cascade);
			modelBuilder.Entity<Show>()
				.HasMany(x => x.Episodes)
				.WithOne(x => x.Show)
				.OnDelete(DeleteBehavior.Cascade);
			modelBuilder.Entity<Season>()
				.HasMany(x => x.Episodes)
				.WithOne(x => x.Season)
				.OnDelete(DeleteBehavior.Cascade);
			modelBuilder.Entity<Episode>()
				.HasMany(x => x.Tracks)
				.WithOne(x => x.Episode)
				.OnDelete(DeleteBehavior.Cascade);

			modelBuilder.Entity<Show>()
				.HasOne(x => x.Studio)
				.WithMany(x => x.Shows)
				.OnDelete(DeleteBehavior.SetNull);

			_HasManyToMany<Library, Provider>(modelBuilder, x => x.Providers, x => x.Libraries);
			_HasManyToMany<Library, Collection>(modelBuilder, x => x.Collections, x => x.Libraries);
			_HasManyToMany<Library, Show>(modelBuilder, x => x.Shows, x => x.Libraries);
			_HasManyToMany<Collection, Show>(modelBuilder, x => x.Shows, x => x.Collections);
			_HasManyToMany<Show, Genre>(modelBuilder, x => x.Genres, x => x.Shows);

			modelBuilder.Entity<User>()
				.HasMany(x => x.Watched)
				.WithMany("Users")
				.UsingEntity(x => x.ToTable(LinkName<User, Show>()));

			_HasMetadata<Collection>(modelBuilder);
			_HasMetadata<Show>(modelBuilder);
			_HasMetadata<Season>(modelBuilder);
			_HasMetadata<Episode>(modelBuilder);
			_HasMetadata<People>(modelBuilder);
			_HasMetadata<Studio>(modelBuilder);

			modelBuilder.Entity<WatchedEpisode>()
				.HasKey(x => new { User = x.UserID, Episode = x.EpisodeID });

			modelBuilder.Entity<Collection>().Property(x => x.Slug).IsRequired();
			modelBuilder.Entity<Genre>().Property(x => x.Slug).IsRequired();
			modelBuilder.Entity<Library>().Property(x => x.Slug).IsRequired();
			modelBuilder.Entity<People>().Property(x => x.Slug).IsRequired();
			modelBuilder.Entity<Provider>().Property(x => x.Slug).IsRequired();
			modelBuilder.Entity<Show>().Property(x => x.Slug).IsRequired();
			modelBuilder.Entity<Studio>().Property(x => x.Slug).IsRequired();
			modelBuilder.Entity<User>().Property(x => x.Slug).IsRequired();

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
				.HasIndex(x => new { x.ShowID, x.SeasonNumber })
				.IsUnique();
			modelBuilder.Entity<Season>()
				.HasIndex(x => x.Slug)
				.IsUnique();
			modelBuilder.Entity<Episode>()
				.HasIndex(x => new { x.ShowID, x.SeasonNumber, x.EpisodeNumber, x.AbsoluteNumber })
				.IsUnique();
			modelBuilder.Entity<Episode>()
				.HasIndex(x => x.Slug)
				.IsUnique();
			modelBuilder.Entity<Track>()
				.HasIndex(x => new { x.EpisodeID, x.Type, x.Language, x.TrackIndex, x.IsForced })
				.IsUnique();
			modelBuilder.Entity<Track>()
				.HasIndex(x => x.Slug)
				.IsUnique();
			modelBuilder.Entity<User>()
				.HasIndex(x => x.Slug)
				.IsUnique();

			modelBuilder.Entity<Season>()
				.Property(x => x.Slug)
				.ValueGeneratedOnAddOrUpdate();
			modelBuilder.Entity<Episode>()
				.Property(x => x.Slug)
				.ValueGeneratedOnAddOrUpdate();
			modelBuilder.Entity<Track>()
				.Property(x => x.Slug)
				.ValueGeneratedOnAddOrUpdate();
		}

		/// <summary>
		/// Return a new or an in cache temporary object wih the same ID as the one given
		/// </summary>
		/// <param name="model">If a resource with the same ID is found in the database, it will be used.
		/// <paramref name="model"/> will be used otherwise</param>
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
		/// <param name="acceptAllChangesOnSuccess">Indicates whether AcceptAllChanges() is called after the changes
		/// have been sent successfully to the database.</param>
		/// <param name="cancellationToken">A <see cref="CancellationToken"/> to observe while waiting for the task to complete</param>
		/// <exception cref="DuplicatedItemException">A duplicated item has been found.</exception>
		/// <returns>The number of state entries written to the database.</returns>
		public override async Task<int> SaveChangesAsync(bool acceptAllChangesOnSuccess,
			CancellationToken cancellationToken = default)
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
		public override async Task<int> SaveChangesAsync(CancellationToken cancellationToken = default)
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
		/// <param name="getExisting">How to retrieve the conflicting item.</param>
		/// <param name="cancellationToken">A <see cref="CancellationToken"/> to observe while waiting for the task to complete</param>
		/// <exception cref="DuplicatedItemException">A duplicated item has been found.</exception>
		/// <typeparam name="T">The type of the potential duplicate (this is unused).</typeparam>
		/// <returns>The number of state entries written to the database.</returns>
		public async Task<int> SaveChangesAsync<T>(
			Func<Task<T>> getExisting,
			CancellationToken cancellationToken = default)
		{
			try
			{
				return await base.SaveChangesAsync(cancellationToken);
			}
			catch (DbUpdateException ex)
			{
				DiscardChanges();
				if (IsDuplicateException(ex))
					throw new DuplicatedItemException(await getExisting());
				throw;
			}
		}

		/// <summary>
		/// Save changes if no duplicates are found. If one is found, no change are saved but the current changes are no discarded.
		/// The current context will still hold those invalid changes.
		/// </summary>
		/// <param name="cancellationToken">A <see cref="CancellationToken"/> to observe while waiting for the task to complete</param>
		/// <returns>The number of state entries written to the database or -1 if a duplicate exist.</returns>
		public async Task<int> SaveIfNoDuplicates(CancellationToken cancellationToken = default)
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
		/// Return the first resource with the given slug that is currently tracked by this context.
		/// This allow one to limit redundant calls to <see cref="IRepository{T}.CreateIfNotExists"/> during the
		/// same transaction and prevent fails from EF when two same entities are being tracked.
		/// </summary>
		/// <param name="slug">The slug of the resource to check</param>
		/// <typeparam name="T">The type of entity to check</typeparam>
		/// <returns>The local entity representing the resource with the given slug if it exists or null.</returns>
		[CanBeNull]
		public T LocalEntity<T>(string slug)
			where T : class, IResource
		{
			return ChangeTracker.Entries<T>()
				.FirstOrDefault(x => x.Entity.Slug == slug)
				?.Entity;
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
		public void DiscardChanges()
		{
			foreach (EntityEntry entry in ChangeTracker.Entries().Where(x => x.State != EntityState.Detached))
			{
				entry.State = EntityState.Detached;
			}
		}

		/// <summary>
		/// Perform a case insensitive like operation.
		/// </summary>
		/// <param name="query">An accessor to get the item that will be checked.</param>
		/// <param name="format">The second operator of the like format.</param>
		/// <typeparam name="T">The type of the item to query</typeparam>
		/// <returns>An expression representing the like query. It can directly be passed to a where call.</returns>
		public abstract Expression<Func<T, bool>> Like<T>(Expression<Func<T, string>> query, string format);
	}
}
