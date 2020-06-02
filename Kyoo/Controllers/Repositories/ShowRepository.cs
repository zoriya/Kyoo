using System;
using System.Collections.Generic;
using System.Linq;
using System.Threading.Tasks;
using Kyoo.Models;
using Kyoo.Models.Exceptions;
using Microsoft.EntityFrameworkCore;

namespace Kyoo.Controllers
{
	public class ShowRepository : IShowRepository
	{
		private readonly DatabaseContext _database;
		private readonly IGenreRepository _genres;
		private readonly IPeopleRepository _people;
		private readonly IStudioRepository _studio;
		private readonly IProviderRepository _providers;

		public ShowRepository(DatabaseContext database,
			IGenreRepository genres,
			IPeopleRepository people,
			IStudioRepository studio, 
			IProviderRepository providers)
		{
			_database = database;
			_genres = genres;
			_people = people;
			_studio = studio;
			_providers = providers;
		}
		
		public Task<Show> Get(long id)
		{
			return Task.FromResult(_database.Shows.FirstOrDefault(x => x.ID == id));
		}
		
		public Task<Show> Get(string slug)
		{
			return Task.FromResult(_database.Shows.FirstOrDefault(x => x.Slug == slug));
		}

		public Task<IEnumerable<Show>> Search(string query)
		{
			return Task.FromResult<IEnumerable<Show>>(
				_database.Shows.FromSqlInterpolated($@"SELECT * FROM Shows WHERE Shows.Title LIKE {$"%{query}%"}
			                                           OR Shows.Aliases LIKE {$"%{query}%"}").Take(20).ToList());
		}

		public Task<IEnumerable<Show>> GetAll()
		{
			return Task.FromResult<IEnumerable<Show>>(_database.Shows.ToList());
		}

		public async Task<long> Create(Show obj)
		{
			if (obj == null)
				throw new ArgumentNullException(nameof(obj));
			
			obj.StudioID = await _studio.CreateIfNotExists(obj.Studio);
			obj.GenreLinks = (await Task.WhenAll(obj.GenreLinks.Select(async x =>
			{
				x.GenreID = await _genres.CreateIfNotExists(x.Genre);
				return x;
			}))).ToList();
			obj.People = (await Task.WhenAll(obj.People.Select(async x =>
			{
				x.PeopleID = await _people.CreateIfNotExists(x.People);
				return x;
			}))).ToList();
			obj.ExternalIDs = (await Task.WhenAll(obj.ExternalIDs.Select(async x =>
			{
				x.ProviderID = await _providers.CreateIfNotExists(x.Provider);
				return x;
			}))).ToList();
			
			obj.Seasons = null;
			obj.Episodes = null;
			
			await _database.Shows.AddAsync(obj);
			await _database.SaveChangesAsync();
			return obj.ID;
		}
		
		public async Task<long> CreateIfNotExists(Show obj)
		{
			if (obj == null)
				throw new ArgumentNullException(nameof(obj));

			Show old = await Get(obj.Slug);
			if (old != null)
				return old.ID;
			return await Create(obj);
		}

		public async Task Edit(Show edited, bool resetOld)
		{
			if (edited == null)
				throw new ArgumentNullException(nameof(edited));
			
			Show old = await Get(edited.Slug);

			if (old == null)
				throw new ItemNotFound($"No show found with the slug {edited.Slug}.");
			
			if (resetOld)
				Utility.Nullify(old);
			Utility.Merge(old, edited);
			await _database.SaveChangesAsync();
		}

		public async Task Delete(Show show)
		{
			_database.Shows.Remove(show);
			await _database.SaveChangesAsync();
		}
	}
}