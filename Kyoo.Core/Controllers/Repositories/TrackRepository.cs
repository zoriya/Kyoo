using System;
using System.Collections.Generic;
using System.Linq.Expressions;
using System.Threading.Tasks;
using Kyoo.Abstractions.Controllers;
using Kyoo.Abstractions.Models;
using Kyoo.Database;
using Microsoft.EntityFrameworkCore;

namespace Kyoo.Core.Controllers
{
	/// <summary>
	/// A local repository to handle tracks.
	/// </summary>
	public class TrackRepository : LocalRepository<Track>, ITrackRepository
	{
		/// <summary>
		/// The database handle
		/// </summary>
		private readonly DatabaseContext _database;
		
		/// <inheritdoc />
		protected override Expression<Func<Track, object>> DefaultSort => x => x.TrackIndex;


		/// <summary>
		/// Create a new <see cref="TrackRepository"/>.
		/// </summary>
		/// <param name="database">The database handle</param>
		public TrackRepository(DatabaseContext database) 
			: base(database)
		{
			_database = database;
		}

		/// <inheritdoc />
		public override Task<ICollection<Track>> Search(string query)
		{
			throw new InvalidOperationException("Tracks do not support the search method.");
		}

		/// <inheritdoc />
		protected override async Task Validate(Track resource)
		{
			await base.Validate(resource);
			if (resource.EpisodeID <= 0)
			{
				resource.EpisodeID = resource.Episode?.ID ?? 0;
				if (resource.EpisodeID <= 0)
					throw new ArgumentException("Can't store a track not related to any episode " +
						$"(episodeID: {resource.EpisodeID}).");
			}
		}

		/// <inheritdoc />
		public override async Task<Track> Create(Track obj)
		{
			if (obj == null)
				throw new ArgumentNullException(nameof(obj));

			await base.Create(obj);
			_database.Entry(obj).State = EntityState.Added;
			await _database.SaveChangesAsync();
			return obj;
		}

		/// <inheritdoc />
		public override async Task Delete(Track obj)
		{
			if (obj == null)
				throw new ArgumentNullException(nameof(obj));
			
			_database.Entry(obj).State = EntityState.Deleted;
			await _database.SaveChangesAsync();
		}
	}
}
