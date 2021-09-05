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
// 	public class ExtractMetadata : ITask
// 	{
// 		public string Slug => "extract";
// 		public string Name => "Metadata Extractor";
// 		public string Description => "Extract subtitles or download thumbnails for a show/episode.";
// 		public string HelpMessage => null;
// 		public bool RunOnStartup => false;
// 		public int Priority => 0;
//
//
// 		private ILibraryManager _library;
// 		private IThumbnailsManager _thumbnails;
// 		private ITranscoder _transcoder;
//
// 		public async Task Run(IServiceProvider serviceProvider, CancellationToken token, string arguments = null)
// 		{
// 			string[] args = arguments?.Split('/');
//
// 			if (args == null || args.Length < 2)
// 				return;
//
// 			string slug = args[1];
// 			bool thumbs = args.Length < 3 || string.Equals(args[2], "thumbnails", StringComparison.InvariantCultureIgnoreCase);
// 			bool subs = args.Length < 3 || string.Equals(args[2], "subs", StringComparison.InvariantCultureIgnoreCase);
//
// 			using IServiceScope serviceScope = serviceProvider.CreateScope();
// 			_library = serviceScope.ServiceProvider.GetService<ILibraryManager>();
// 			_thumbnails = serviceScope.ServiceProvider.GetService<IThumbnailsManager>();
// 			_transcoder = serviceScope.ServiceProvider.GetService<ITranscoder>();
// 			int id;
//
// 			switch (args[0].ToLowerInvariant())
// 			{
// 				case "show":
// 				case "shows":
// 					Show show = await (int.TryParse(slug, out id)
// 						? _library!.Get<Show>(id)
// 						: _library!.Get<Show>(slug));
// 					await ExtractShow(show, thumbs, subs, token);
// 					break;
// 				case "season":
// 				case "seasons":
// 					Season season = await (int.TryParse(slug, out id)
// 						? _library!.Get<Season>(id)
// 						: _library!.Get<Season>(slug));
// 					await ExtractSeason(season, thumbs, subs, token);
// 					break;
// 				case "episode":
// 				case "episodes":
// 					Episode episode = await (int.TryParse(slug, out id)
// 						? _library!.Get<Episode>(id)
// 						: _library!.Get<Episode>(slug));
// 					await ExtractEpisode(episode, thumbs, subs);
// 					break;
// 			}
// 		}
//
// 		private async Task ExtractShow(Show show, bool thumbs, bool subs, CancellationToken token)
// 		{
// 			if (thumbs)
// 				await _thumbnails!.Validate(show, true);
// 			await _library.Load(show, x => x.Seasons);
// 			foreach (Season season in show.Seasons)
// 			{
// 				if (token.IsCancellationRequested)
// 					return;
// 				await ExtractSeason(season, thumbs, subs, token);
// 			}
// 		}
//
// 		private async Task ExtractSeason(Season season, bool thumbs, bool subs, CancellationToken token)
// 		{
// 			if (thumbs)
// 				await _thumbnails!.Validate(season, true);
// 			await _library.Load(season, x => x.Episodes);
// 			foreach (Episode episode in season.Episodes)
// 			{
// 				if (token.IsCancellationRequested)
// 					return;
// 				await ExtractEpisode(episode, thumbs, subs);
// 			}
// 		}
//
// 		private async Task ExtractEpisode(Episode episode, bool thumbs, bool subs)
// 		{
// 			if (thumbs)
// 				await _thumbnails!.Validate(episode, true);
// 			if (subs)
// 			{
// 				await _library.Load(episode, x => x.Tracks);
// 				episode.Tracks = (await _transcoder!.ExtractInfos(episode, true))
// 					.Where(x => x.Type != StreamType.Attachment)
// 					.Concat(episode.Tracks.Where(x => x.IsExternal))
// 					.ToList();
// 				await _library.Edit(episode, false);
// 			}
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
