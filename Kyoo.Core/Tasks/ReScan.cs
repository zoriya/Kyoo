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

// using System;
// using System.Collections.Generic;
// using System.Linq;
// using System.Threading;
// using System.Threading.Tasks;
// using Kyoo.Controllers;
// using Kyoo.Models;
// using Microsoft.Extensions.DependencyInjection;
//
// namespace Kyoo.Tasks
// {
// 	public class ReScan: ITask
// 	{
// 		public string Slug => "re-scan";
// 		public string Name => "ReScan";
// 		public string Description => "Re download metadata of an item using it's external ids.";
// 		public string HelpMessage => null;
// 		public bool RunOnStartup => false;
// 		public int Priority => 0;
//
//
// 		private IServiceProvider _serviceProvider;
// 		private IThumbnailsManager _thumbnailsManager;
// 		private IProviderManager _providerManager;
// 		private DatabaseContext _database;
//
// 		public async Task Run(IServiceProvider serviceProvider, CancellationToken cancellationToken, string arguments = null)
// 		{
// 			using IServiceScope serviceScope = serviceProvider.CreateScope();
// 			_serviceProvider = serviceProvider;
// 			_thumbnailsManager = serviceProvider.GetService<IThumbnailsManager>();
// 			_providerManager = serviceProvider.GetService<IProviderManager>();
// 			_database = serviceScope.ServiceProvider.GetService<DatabaseContext>();
//
// 			if (arguments == null || !arguments.Contains('/'))
// 				return;
//
// 			string slug = arguments.Substring(arguments.IndexOf('/') + 1);
// 			switch (arguments.Substring(0, arguments.IndexOf('/')))
// 			{
// 				case "show":
// 					await ReScanShow(slug);
// 					break;
// 				case "season":
// 					await ReScanSeason(slug);
// 					break;
// 			}
// 		}
//
// 		private async Task ReScanShow(string slug)
// 		{
// 			Show old;
//
// 			using (IServiceScope serviceScope = _serviceProvider.CreateScope())
// 			{
// 				ILibraryManager libraryManager = serviceScope.ServiceProvider.GetService<ILibraryManager>();
// 				old = _database.Shows.FirstOrDefault(x => x.Slug == slug);
// 				if (old == null)
// 					return;
// 				Library library = _database.LibraryLinks.First(x => x.Show == old && x.Library != null).Library;
// 				Show edited = await _providerManager.CompleteShow(old, library);
// 				edited.ID = old.ID;
// 				edited.Slug = old.Slug;
// 				edited.Path = old.Path;
// 				await libraryManager.EditShow(edited, true);
// 				await _thumbnailsManager.Validate(edited, true);
// 			}
// 			if (old.Seasons != null)
// 				await Task.WhenAll(old.Seasons.Select(x => ReScanSeason(old, x)));
// 			IEnumerable<Episode> orphans = old.Episodes.Where(x => x.Season == null).ToList();
// 			if (orphans.Any())
// 				await Task.WhenAll(orphans.Select(x => ReScanEpisode(old, x)));
// 		}
//
// 		private async Task ReScanSeason(string seasonSlug)
// 		{
// 			string[] infos = seasonSlug.Split('-');
// 			if (infos.Length != 2 || int.TryParse(infos[1], out int seasonNumber))
// 				return;
// 			string slug = infos[0];
// 			Show show = _database.Shows.FirstOrDefault(x => x.Slug == slug);
// 			if (show == null)
// 				return;
// 			Season old = _database.Seasons.FirstOrDefault(x => x.SeasonNumber == seasonNumber && x.Show.ID == show.ID);
// 			if (old == null)
// 				return;
// 			await ReScanSeason(show, old);
// 		}
//
// 		private async Task ReScanSeason(Show show, Season old)
// 		{
// 			using (IServiceScope serviceScope = _serviceProvider.CreateScope())
// 			{
// 				ILibraryManager libraryManager = serviceScope.ServiceProvider.GetService<ILibraryManager>();
// 				Library library = _database.LibraryLinks.First(x => x.Show == show && x.Library != null).Library;
// 				Season edited = await _providerManager.GetSeason(show, old.SeasonNumber, library);
// 				edited.ID = old.ID;
// 				await libraryManager.EditSeason(edited, true);
// 				await _thumbnailsManager.Validate(edited, true);
// 			}
// 			if (old.Episodes != null)
// 				await Task.WhenAll(old.Episodes.Select(x => ReScanEpisode(show, x)));
// 		}
//
// 		private async Task ReScanEpisode(Show show, Episode old)
// 		{
// 			using IServiceScope serviceScope = _serviceProvider.CreateScope();
// 			ILibraryManager libraryManager = serviceScope.ServiceProvider.GetService<ILibraryManager>();
//
// 			Library library = _database.LibraryLinks.First(x => x.Show == show && x.Library != null).Library;
// 			Episode edited = await _providerManager.GetEpisode(show, old.Path, old.SeasonNumber, old.EpisodeNumber, old.AbsoluteNumber, library);
// 			edited.ID = old.ID;
// 			await libraryManager.EditEpisode(edited, true);
// 			await _thumbnailsManager.Validate(edited, true);
// 		}
//
// 		public Task<IEnumerable<string>> GetPossibleParameters()
// 		{
// 			return Task.FromResult<IEnumerable<string>>(null);
// 		}
//
// 		public int? Progress()
// 		{
// 			return null;
// 		}
// 	}
// }
