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
using System.Text.Json;
using System.Threading;
using System.Threading.Tasks;
using Kyoo.Abstractions.Controllers;
using Kyoo.Abstractions.Models;
using Kyoo.Abstractions.Models.Exceptions;
using Kyoo.Authentication;
using Microsoft.AspNetCore.Http;
using Microsoft.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore.ChangeTracking;

namespace Kyoo.Postgresql
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
		private readonly IHttpContextAccessor _accessor;

		/// <summary>
		/// Calculate the MD5 of a string, can only be used in database context.
		/// </summary>
		/// <param name="str">The string to hash</param>
		/// <returns>The hash</returns>
		public static string MD5(string str) => throw new NotSupportedException();

		public Guid? CurrentUserId => _accessor.HttpContext?.User.GetId();

		/// <summary>
		/// All collections of Kyoo. See <see cref="Collection"/>.
		/// </summary>
		public DbSet<Collection> Collections { get; set; }

		/// <summary>
		/// All movies of Kyoo. See <see cref="Movie"/>.
		/// </summary>
		public DbSet<Movie> Movies { get; set; }

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

		// /// <summary>
		// /// All people of Kyoo. See <see cref="People"/>.
		// /// </summary>
		// public DbSet<People> People { get; set; }

		/// <summary>
		/// All studios of Kyoo. See <see cref="Studio"/>.
		/// </summary>
		public DbSet<Studio> Studios { get; set; }

		/// <summary>
		/// The list of registered users.
		/// </summary>
		public DbSet<User> Users { get; set; }

		// /// <summary>
		// /// All people's role. See <see cref="PeopleRole"/>.
		// /// </summary>
		// public DbSet<PeopleRole> PeopleRoles { get; set; }

		public DbSet<MovieWatchStatus> MovieWatchStatus { get; set; }

		public DbSet<ShowWatchStatus> ShowWatchStatus { get; set; }

		public DbSet<EpisodeWatchStatus> EpisodeWatchStatus { get; set; }

		public DbSet<Issue> Issues { get; set; }

		/// <summary>
		/// Add a many to many link between two resources.
		/// </summary>
		/// <remarks>Types are order dependant. You can't inverse the order. Please always put the owner first.</remarks>
		/// <param name="first">The ID of the first resource.</param>
		/// <param name="second">The ID of the second resource.</param>
		/// <typeparam name="T1">The first resource type of the relation. It is the owner of the second</typeparam>
		/// <typeparam name="T2">The second resource type of the relation. It is the contained resource.</typeparam>
		public void AddLinks<T1, T2>(Guid first, Guid second)
			where T1 : class, IResource
			where T2 : class, IResource
		{
			Set<Dictionary<string, object>>(LinkName<T1, T2>())
				.Add(
					new Dictionary<string, object>
					{
						[LinkNameFk<T1>()] = first,
						[LinkNameFk<T2>()] = second
					}
				);
		}

		protected DatabaseContext(IHttpContextAccessor accessor)
		{
			_accessor = accessor;
		}

		protected DatabaseContext(DbContextOptions options, IHttpContextAccessor accessor)
			: base(options)
		{
			_accessor = accessor;
		}

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
		private static void _HasMetadata<T>(ModelBuilder modelBuilder)
			where T : class, IMetadata
		{
			// TODO: Waiting for https://github.com/dotnet/efcore/issues/29825
			// modelBuilder.Entity<T>()
			// 	.OwnsOne(x => x.ExternalId, x =>
			// 	{
			// 		x.ToJson();
			// 	});
			modelBuilder
				.Entity<T>()
				.Property(x => x.ExternalId)
				.HasConversion(
					v => JsonSerializer.Serialize(v, (JsonSerializerOptions?)null),
					v =>
						JsonSerializer.Deserialize<Dictionary<string, MetadataId>>(
							v,
							(JsonSerializerOptions?)null
						)!
				)
				.HasColumnType("json");
		}

		private static void _HasImages<T>(ModelBuilder modelBuilder)
			where T : class, IThumbnails
		{
			modelBuilder.Entity<T>().OwnsOne(x => x.Poster);
			modelBuilder.Entity<T>().OwnsOne(x => x.Thumbnail);
			modelBuilder.Entity<T>().OwnsOne(x => x.Logo);
		}

		private static void _HasAddedDate<T>(ModelBuilder modelBuilder)
			where T : class, IAddedDate
		{
			modelBuilder
				.Entity<T>()
				.Property(x => x.AddedDate)
				.HasDefaultValueSql("now() at time zone 'utc'")
				.ValueGeneratedOnAdd();
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
		private void _HasManyToMany<T, T2>(
			ModelBuilder modelBuilder,
			Expression<Func<T, IEnumerable<T2>?>> firstNavigation,
			Expression<Func<T2, IEnumerable<T>?>> secondNavigation
		)
			where T : class, IResource
			where T2 : class, IResource
		{
			modelBuilder
				.Entity<T2>()
				.HasMany(secondNavigation)
				.WithMany(firstNavigation)
				.UsingEntity<Dictionary<string, object>>(
					LinkName<T, T2>(),
					x =>
						x.HasOne<T>()
							.WithMany()
							.HasForeignKey(LinkNameFk<T>())
							.OnDelete(DeleteBehavior.Cascade),
					x =>
						x.HasOne<T2>()
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

			modelBuilder.Entity<Show>().Ignore(x => x.FirstEpisode).Ignore(x => x.AirDate);
			modelBuilder
				.Entity<Episode>()
				.Ignore(x => x.PreviousEpisode)
				.Ignore(x => x.NextEpisode);

			// modelBuilder.Entity<PeopleRole>()
			// 	.Ignore(x => x.ForPeople);
			modelBuilder
				.Entity<Show>()
				.HasMany(x => x.Seasons)
				.WithOne(x => x.Show)
				.OnDelete(DeleteBehavior.Cascade);
			modelBuilder
				.Entity<Show>()
				.HasMany(x => x.Episodes)
				.WithOne(x => x.Show)
				.OnDelete(DeleteBehavior.Cascade);
			modelBuilder
				.Entity<Season>()
				.HasMany(x => x.Episodes)
				.WithOne(x => x.Season)
				.OnDelete(DeleteBehavior.Cascade);

			modelBuilder
				.Entity<Movie>()
				.HasOne(x => x.Studio)
				.WithMany(x => x.Movies)
				.OnDelete(DeleteBehavior.SetNull);
			modelBuilder
				.Entity<Show>()
				.HasOne(x => x.Studio)
				.WithMany(x => x.Shows)
				.OnDelete(DeleteBehavior.SetNull);

			_HasManyToMany<Collection, Movie>(modelBuilder, x => x.Movies, x => x.Collections);
			_HasManyToMany<Collection, Show>(modelBuilder, x => x.Shows, x => x.Collections);

			_HasMetadata<Collection>(modelBuilder);
			_HasMetadata<Movie>(modelBuilder);
			_HasMetadata<Show>(modelBuilder);
			_HasMetadata<Season>(modelBuilder);
			_HasMetadata<Episode>(modelBuilder);
			// _HasMetadata<People>(modelBuilder);
			_HasMetadata<Studio>(modelBuilder);

			_HasImages<Collection>(modelBuilder);
			_HasImages<Movie>(modelBuilder);
			_HasImages<Show>(modelBuilder);
			_HasImages<Season>(modelBuilder);
			// _HasImages<People>(modelBuilder);
			_HasImages<Episode>(modelBuilder);

			_HasAddedDate<Collection>(modelBuilder);
			_HasAddedDate<Movie>(modelBuilder);
			_HasAddedDate<Show>(modelBuilder);
			_HasAddedDate<Season>(modelBuilder);
			_HasAddedDate<Episode>(modelBuilder);
			_HasAddedDate<User>(modelBuilder);
			_HasAddedDate<Issue>(modelBuilder);

			modelBuilder
				.Entity<User>()
				.Property(x => x.Settings)
				.HasConversion(
					v => JsonSerializer.Serialize(v, (JsonSerializerOptions?)null),
					v =>
						JsonSerializer.Deserialize<Dictionary<string, string>>(
							v,
							(JsonSerializerOptions?)null
						)!
				)
				.HasColumnType("json");

			modelBuilder
				.Entity<MovieWatchStatus>()
				.HasKey(x => new { User = x.UserId, Movie = x.MovieId });
			modelBuilder
				.Entity<ShowWatchStatus>()
				.HasKey(x => new { User = x.UserId, Show = x.ShowId });
			modelBuilder
				.Entity<EpisodeWatchStatus>()
				.HasKey(x => new { User = x.UserId, Episode = x.EpisodeId });

			modelBuilder
				.Entity<MovieWatchStatus>()
				.HasOne(x => x.Movie)
				.WithMany(x => x.Watched)
				.HasForeignKey(x => x.MovieId)
				.OnDelete(DeleteBehavior.Cascade);
			modelBuilder
				.Entity<ShowWatchStatus>()
				.HasOne(x => x.Show)
				.WithMany(x => x.Watched)
				.HasForeignKey(x => x.ShowId)
				.OnDelete(DeleteBehavior.Cascade);
			modelBuilder
				.Entity<ShowWatchStatus>()
				.HasOne(x => x.NextEpisode)
				.WithMany()
				.HasForeignKey(x => x.NextEpisodeId)
				.OnDelete(DeleteBehavior.SetNull);
			modelBuilder
				.Entity<EpisodeWatchStatus>()
				.HasOne(x => x.Episode)
				.WithMany(x => x.Watched)
				.HasForeignKey(x => x.EpisodeId)
				.OnDelete(DeleteBehavior.Cascade);

			modelBuilder.Entity<MovieWatchStatus>().HasQueryFilter(x => x.UserId == CurrentUserId);
			modelBuilder.Entity<ShowWatchStatus>().HasQueryFilter(x => x.UserId == CurrentUserId);
			modelBuilder
				.Entity<EpisodeWatchStatus>()
				.HasQueryFilter(x => x.UserId == CurrentUserId);

			modelBuilder.Entity<ShowWatchStatus>().Navigation(x => x.NextEpisode).AutoInclude();

			_HasAddedDate<MovieWatchStatus>(modelBuilder);
			_HasAddedDate<ShowWatchStatus>(modelBuilder);
			_HasAddedDate<EpisodeWatchStatus>(modelBuilder);

			modelBuilder.Entity<Movie>().Ignore(x => x.WatchStatus);
			modelBuilder.Entity<Show>().Ignore(x => x.WatchStatus);
			modelBuilder.Entity<Episode>().Ignore(x => x.WatchStatus);

			modelBuilder.Entity<Collection>().HasIndex(x => x.Slug).IsUnique();
			// modelBuilder.Entity<People>()
			// 	.HasIndex(x => x.Slug)
			// 	.IsUnique();
			modelBuilder.Entity<Movie>().HasIndex(x => x.Slug).IsUnique();
			modelBuilder.Entity<Show>().HasIndex(x => x.Slug).IsUnique();
			modelBuilder.Entity<Studio>().HasIndex(x => x.Slug).IsUnique();
			modelBuilder
				.Entity<Season>()
				.HasIndex(x => new { ShowID = x.ShowId, x.SeasonNumber })
				.IsUnique();
			modelBuilder.Entity<Season>().HasIndex(x => x.Slug).IsUnique();
			modelBuilder
				.Entity<Episode>()
				.HasIndex(x => new
				{
					ShowID = x.ShowId,
					x.SeasonNumber,
					x.EpisodeNumber,
					x.AbsoluteNumber
				})
				.IsUnique();
			modelBuilder.Entity<Episode>().HasIndex(x => x.Slug).IsUnique();
			modelBuilder.Entity<User>().HasIndex(x => x.Slug).IsUnique();

			modelBuilder.Entity<Movie>().Ignore(x => x.Links);


			modelBuilder.Entity<Issue>()
				.HasKey(x => new { x.Domain, x.Cause });

			// TODO: Waiting for https://github.com/dotnet/efcore/issues/29825
			// modelBuilder.Entity<T>()
			// 	.OwnsOne(x => x.ExternalId, x =>
			// 	{
			// 		x.ToJson();
			// 	});
			modelBuilder.Entity<Issue>()
				.Property(x => x.Extra)
				.HasConversion(
					v => JsonSerializer.Serialize(v, (JsonSerializerOptions?)null),
					v =>
						JsonSerializer.Deserialize<Dictionary<string, object>>(
							v,
							(JsonSerializerOptions?)null
						)!
				)
				.HasColumnType("json");
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
			T? tmp = Set<T>().Local.FirstOrDefault(x => x.Id == model.Id);
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
		public override async Task<int> SaveChangesAsync(
			bool acceptAllChangesOnSuccess,
			CancellationToken cancellationToken = default
		)
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
		public override async Task<int> SaveChangesAsync(
			CancellationToken cancellationToken = default
		)
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
			CancellationToken cancellationToken = default
		)
		{
			try
			{
				return await SaveChangesAsync(cancellationToken);
			}
			catch (DbUpdateException ex)
			{
				DiscardChanges();
				if (IsDuplicateException(ex))
					throw new DuplicatedItemException(await getExisting());
				throw;
			}
			catch (DuplicatedItemException)
			{
				throw new DuplicatedItemException(await getExisting());
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
		public T? LocalEntity<T>(string slug)
			where T : class, IResource
		{
			return ChangeTracker.Entries<T>().FirstOrDefault(x => x.Entity.Slug == slug)?.Entity;
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
			foreach (
				EntityEntry entry in ChangeTracker
					.Entries()
					.Where(x => x.State != EntityState.Detached)
			)
			{
				entry.State = EntityState.Detached;
			}
		}
	}
}
