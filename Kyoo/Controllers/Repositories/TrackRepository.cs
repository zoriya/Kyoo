using System;
using System.Collections.Generic;
using System.Threading.Tasks;
using Kyoo.Models;
using Kyoo.Models.Exceptions;
using Microsoft.EntityFrameworkCore;

namespace Kyoo.Controllers
{
	public class TrackRepository : ITrackRepository
	{
		private readonly DatabaseContext _database;


		public TrackRepository(DatabaseContext database)
		{
			_database = database;
		}
		
		public void Dispose()
		{
			_database.Dispose();
		}

		public ValueTask DisposeAsync()
		{
			return _database.DisposeAsync();
		}
		
		public async Task<Track> Get(int id)
		{
			return await _database.Tracks.FirstOrDefaultAsync(x => x.ID == id);
		}
		
		public Task<Track> Get(string slug)
		{
			throw new InvalidOperationException("Tracks do not support the get by slug method.");
		}

		public Task<Track> Get(int episodeID, string languageTag, bool isForced)
		{
			return _database.Tracks.FirstOrDefaultAsync(x => x.EpisodeID == episodeID
			                                                       && x.Language == languageTag
			                                                       && x.IsForced == isForced);
		}

		public Task<ICollection<Track>> Search(string query)
		{
			throw new InvalidOperationException("Tracks do not support the search method.");
		}

		public async Task<ICollection<Track>> GetAll()
		{
			return await _database.Tracks.ToListAsync();
		}

		public async Task<int> Create(Track obj)
		{
			if (obj == null)
				throw new ArgumentNullException(nameof(obj));

			if (obj.EpisodeID <= 0)
				throw new InvalidOperationException($"Can't store a track not related to any episode (episodeID: {obj.EpisodeID}).");

			_database.Entry(obj).State = EntityState.Added;
			
			try
			{
				await _database.SaveChangesAsync();
			}
			catch (DbUpdateException ex)
			{
				_database.DiscardChanges();
				if (Helper.IsDuplicateException(ex))
					throw new DuplicatedItemException($"Trying to insert a duplicated track (slug {obj.Slug} already exists).");
				throw;
			}
			return obj.ID;
		}
		
		public Task<int> CreateIfNotExists(Track obj)
		{
			return Create(obj);
		}

		public async Task Edit(Track edited, bool resetOld)
		{
			if (edited == null)
				throw new ArgumentNullException(nameof(edited));
			
			Track old = await Get(edited.ID);

			if (old == null)
				throw new ItemNotFound($"No track found with the ID {edited.ID}.");
			
			if (resetOld)
				Utility.Nullify(old);
			Utility.Merge(old, edited);
			await _database.SaveChangesAsync();
		}

		public async Task Delete(int id)
		{
			Track obj = await Get(id);
			await Delete(obj);
		}

		public async Task Delete(string slug)
		{
			Track obj = await Get(slug);
			await Delete(obj);
		}
		
		public async Task Delete(Track obj)
		{
			if (obj == null)
				throw new ArgumentNullException(nameof(obj));
			
			_database.Entry(obj).State = EntityState.Deleted;
			await _database.SaveChangesAsync();
		}
	}
}