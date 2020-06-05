using System;
using System.Collections.Generic;
using System.Linq;
using System.Threading.Tasks;
using Kyoo.Models;
using Kyoo.Models.Exceptions;
using Microsoft.EntityFrameworkCore;

namespace Kyoo.Controllers
{
	public class SeasonRepository : ISeasonRepository
	{
		private readonly DatabaseContext _database;
		private readonly IProviderRepository _providers;


		public SeasonRepository(DatabaseContext database, IProviderRepository providers)
		{
			_database = database;
			_providers = providers;
		}
		
		public async Task<Season> Get(long id)
		{
			return await _database.Seasons.FirstOrDefaultAsync(x => x.ID == id);
		}

		public Task<Season> Get(string slug)
		{
			int index = slug.IndexOf("-s", StringComparison.Ordinal);
			if (index == -1)
				throw new InvalidOperationException("Invalid season slug. Format: {showSlug}-s{seasonNumber}");
			string showSlug = slug.Substring(0, index);
			if (!long.TryParse(slug.Substring(index + 2), out long seasonNumber))
				throw new InvalidOperationException("Invalid season slug. Format: {showSlug}-s{seasonNumber}");
			return Get(showSlug, seasonNumber);
		}
		
		public async Task<Season> Get(string showSlug, long seasonNumber)
		{
			return await _database.Seasons.FirstOrDefaultAsync(x => x.Show.Slug == showSlug 
			                                                        && x.SeasonNumber == seasonNumber);
		}

		public async Task<IEnumerable<Season>> Search(string query)
		{
			return await _database.Seasons
				.Where(x => EF.Functions.Like(x.Title, $"%{query}%"))
				.Take(20)
				.ToListAsync();
		}

		public async Task<IEnumerable<Season>> GetAll()
		{
			return await _database.Seasons.ToListAsync();
		}

		public async Task<long> Create(Season obj)
		{
			if (obj == null)
				throw new ArgumentNullException(nameof(obj));

			obj.Show = null;
			obj.Episodes = null;
			await Validate(obj);
			
			await _database.Seasons.AddAsync(obj);
			await _database.SaveChangesAsync();
			return obj.ID;
		}
		
		public async Task<long> CreateIfNotExists(Season obj)
		{
			if (obj == null)
				throw new ArgumentNullException(nameof(obj));

			Season old = await Get(obj.Slug);
			if (old != null)
				return old.ID;
			return await Create(obj);
		}

		public async Task Edit(Season edited, bool resetOld)
		{
			if (edited == null)
				throw new ArgumentNullException(nameof(edited));
			
			Season old = await Get(edited.Slug);

			if (old == null)
				throw new ItemNotFound($"No season found with the slug {edited.Slug}.");
			
			if (resetOld)
				Utility.Nullify(old);
			Utility.Merge(old, edited);

			await Validate(old);
			await _database.SaveChangesAsync();
		}

		private async Task Validate(Season obj)
		{
			if (obj.ShowID <= 0)
				throw new InvalidOperationException($"Can't store a season not related to any show (showID: {obj.ShowID}).");
			
			obj.ExternalIDs = (await Task.WhenAll(obj.ExternalIDs.Select(async x =>
			{
				x.ProviderID = await _providers.CreateIfNotExists(x.Provider);
				return x;
			}))).ToList();
		}

		public async Task Delete(Season obj)
		{
			_database.Seasons.Remove(obj);
			await _database.SaveChangesAsync();
		}
	}
}