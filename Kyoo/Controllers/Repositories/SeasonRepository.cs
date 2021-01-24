using System;
using System.Collections.Generic;
using System.Linq;
using System.Linq.Expressions;
using System.Text.RegularExpressions;
using System.Threading.Tasks;
using Kyoo.Models;
using Kyoo.Models.Exceptions;
using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.DependencyInjection;

namespace Kyoo.Controllers
{
	public class SeasonRepository : LocalRepository<Season>, ISeasonRepository
	{
		private bool _disposed;
		private readonly DatabaseContext _database;
		private readonly IProviderRepository _providers;
		private readonly Lazy<IEpisodeRepository> _episodes;
		protected override Expression<Func<Season, object>> DefaultSort => x => x.SeasonNumber;


		public SeasonRepository(DatabaseContext database, 
			IProviderRepository providers,
			IServiceProvider services)
			: base(database)
		{
			_database = database;
			_providers = providers;
			_episodes = new Lazy<IEpisodeRepository>(services.GetRequiredService<IEpisodeRepository>);
		}


		public override void Dispose()
		{
			if (_disposed)
				return;
			_disposed = true;
			_database.Dispose();
			_providers.Dispose();
			if (_episodes.IsValueCreated)
				_episodes.Value.Dispose();
		}

		public override async ValueTask DisposeAsync()
		{
			if (_disposed)
				return;
			_disposed = true;
			await _database.DisposeAsync();
			await _providers.DisposeAsync();
			if (_episodes.IsValueCreated)
				await _episodes.Value.DisposeAsync();
		}

		public override Task<Season> Get(string slug)
		{
			Match match = Regex.Match(slug, @"(?<show>.*)-s(?<season>\d*)");
			
			if (!match.Success)
				throw new ArgumentException("Invalid season slug. Format: {showSlug}-s{seasonNumber}");
			return Get(match.Groups["show"].Value, int.Parse(match.Groups["season"].Value));
		}
		
		public Task<Season> Get(int showID, int seasonNumber)
		{
			return _database.Seasons.FirstOrDefaultAsync(x => x.ShowID == showID 
			                                                  && x.SeasonNumber == seasonNumber);
		}
		
		public Task<Season> Get(string showSlug, int seasonNumber)
		{
			return _database.Seasons.FirstOrDefaultAsync(x => x.Show.Slug == showSlug 
			                                                        && x.SeasonNumber == seasonNumber);
		}

		public async Task<ICollection<Season>> Search(string query)
		{
			return await _database.Seasons
				.Where(x => EF.Functions.ILike(x.Title, $"%{query}%"))
				.Take(20)
				.ToListAsync();
		}
		
		public override async Task<Season> Create(Season obj)
		{
			await base.Create(obj);
			_database.Entry(obj).State = EntityState.Added;
			if (obj.ExternalIDs != null)
				foreach (MetadataID entry in obj.ExternalIDs)
					_database.Entry(entry).State = EntityState.Added;
			
			await _database.SaveChangesAsync($"Trying to insert a duplicated season (slug {obj.Slug} already exists).");
			return obj;
		}

		protected override async Task Validate(Season resource)
		{
			if (resource.ShowID <= 0)
				throw new InvalidOperationException($"Can't store a season not related to any show (showID: {resource.ShowID}).");

			await base.Validate(resource);
			
			if (resource.ExternalIDs != null)
			{
				foreach (MetadataID link in resource.ExternalIDs)
					if (ShouldValidate(link))
						link.Provider = await _providers.CreateIfNotExists(link.Provider, true);
			}
		}
		
		public async Task Delete(string showSlug, int seasonNumber)
		{
			Season obj = await Get(showSlug, seasonNumber);
			await Delete(obj);
		}

		public override async Task Delete(Season obj)
		{
			if (obj == null)
				throw new ArgumentNullException(nameof(obj));
			
			_database.Entry(obj).State = EntityState.Deleted;
			
			if (obj.ExternalIDs != null)
				foreach (MetadataID entry in obj.ExternalIDs)
					_database.Entry(entry).State = EntityState.Deleted;
			
			await _database.SaveChangesAsync();

			if (obj.Episodes != null)
				await _episodes.Value.DeleteRange(obj.Episodes);
		}
	}
}