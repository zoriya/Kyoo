using System.Threading.Tasks;
using Kyoo.Abstractions.Controllers;
using Kyoo.Abstractions.Models;
using Kyoo.Abstractions.Models.Exceptions;
using Kyoo.Controllers;
using Kyoo.Models.Options;
using Microsoft.Extensions.Options;
using Moq;
using Xunit;

namespace Kyoo.Tests.Identifier
{
	public class Identifier
	{
		private readonly Mock<ILibraryManager> _manager;
		private readonly IIdentifier _identifier;
		
		public Identifier()
		{
			Mock<IOptionsMonitor<MediaOptions>> options = new();
			options.Setup(x => x.CurrentValue).Returns(new MediaOptions
			{
				Regex = new []
				{
					"^\\/?(?<Collection>.+)?\\/(?<Show>.+?)(?: \\((?<StartYear>\\d+)\\))?\\/\\k<Show>(?: \\(\\d+\\))? S(?<Season>\\d+)E(?<Episode>\\d+)\\..*$",
					"^\\/?(?<Collection>.+)?\\/(?<Show>.+?)(?: \\((?<StartYear>\\d+)\\))?\\/\\k<Show>(?: \\(\\d+\\))? (?<Absolute>\\d+)\\..*$",
					"^\\/?(?<Collection>.+)?\\/(?<Show>.+?)(?: \\((?<StartYear>\\d+)\\))?\\/\\k<Show>(?: \\(\\d+\\))?\\..*$"
				},
				SubtitleRegex = new[]
				{
					"^(?<Episode>.+)\\.(?<Language>\\w{1,3})\\.(?<Default>default\\.)?(?<Forced>forced\\.)?.*$"
				}
			});
			
			_manager = new Mock<ILibraryManager>();
			_identifier = new RegexIdentifier(options.Object, _manager.Object);
		}
		
		
		[Fact]
		public async Task EpisodeIdentification()
		{
			_manager.Setup(x => x.GetAll(null, new Sort<Library>(), default)).ReturnsAsync(new[]
			{
				new Library {Paths = new [] {"/kyoo/Library/"}}
			});
			(Collection collection, Show show, Season season, Episode episode) = await _identifier.Identify(
				"/kyoo/Library/Collection/Show (2000)/Show S01E01.extension");
			Assert.Equal("Collection", collection.Name);
			Assert.Equal("collection", collection.Slug);
			Assert.Equal("Show", show.Title);
			Assert.Equal("show", show.Slug);
			Assert.Equal(2000, show.StartAir!.Value.Year);
			Assert.Equal(1, season.SeasonNumber);
			Assert.Equal(1, episode.SeasonNumber);
			Assert.Equal(1, episode.EpisodeNumber);
			Assert.Null(episode.AbsoluteNumber);
		}
		
		[Fact]
		public async Task EpisodeIdentificationWithoutLibraryTrailingSlash()
		{
			_manager.Setup(x => x.GetAll(null, new Sort<Library>(), default)).ReturnsAsync(new[]
			{
				new Library {Paths = new [] {"/kyoo/Library"}}
			});
			(Collection collection, Show show, Season season, Episode episode) = await _identifier.Identify(
				"/kyoo/Library/Collection/Show (2000)/Show S01E01.extension");
			Assert.Equal("Collection", collection.Name);
			Assert.Equal("collection", collection.Slug);
			Assert.Equal("Show", show.Title);
			Assert.Equal("show", show.Slug);
			Assert.Equal(2000, show.StartAir!.Value.Year);
			Assert.Equal(1, season.SeasonNumber);
			Assert.Equal(1, episode.SeasonNumber);
			Assert.Equal(1, episode.EpisodeNumber);
			Assert.Null(episode.AbsoluteNumber);
		}
		
		[Fact]
		public async Task EpisodeIdentificationMultiplePaths()
		{
			_manager.Setup(x => x.GetAll(null, new Sort<Library>(), default)).ReturnsAsync(new[]
			{
				new Library {Paths = new [] {"/kyoo", "/kyoo/Library/"}}
			});
			(Collection collection, Show show, Season season, Episode episode) = await _identifier.Identify(
				"/kyoo/Library/Collection/Show (2000)/Show S01E01.extension");
			Assert.Equal("Collection", collection.Name);
			Assert.Equal("collection", collection.Slug);
			Assert.Equal("Show", show.Title);
			Assert.Equal("show", show.Slug);
			Assert.Equal(2000, show.StartAir!.Value.Year);
			Assert.Equal(1, season.SeasonNumber);
			Assert.Equal(1, episode.SeasonNumber);
			Assert.Equal(1, episode.EpisodeNumber);
			Assert.Null(episode.AbsoluteNumber);
		}
		
		[Fact]
		public async Task AbsoluteEpisodeIdentification()
		{
			_manager.Setup(x => x.GetAll(null, new Sort<Library>(), default)).ReturnsAsync(new[]
			{
				new Library {Paths = new [] {"/kyoo", "/kyoo/Library/"}}
			});
			(Collection collection, Show show, Season season, Episode episode) = await _identifier.Identify(
				"/kyoo/Library/Collection/Show (2000)/Show 100.extension");
			Assert.Equal("Collection", collection.Name);
			Assert.Equal("collection", collection.Slug);
			Assert.Equal("Show", show.Title);
			Assert.Equal("show", show.Slug);
			Assert.Equal(2000, show.StartAir!.Value.Year);
			Assert.Null(season);
			Assert.Null(episode.SeasonNumber);
			Assert.Null(episode.EpisodeNumber);
			Assert.Equal(100, episode.AbsoluteNumber);
		}
		
		[Fact]
		public async Task MovieEpisodeIdentification()
		{
			_manager.Setup(x => x.GetAll(null, new Sort<Library>(), default)).ReturnsAsync(new[]
			{
				new Library {Paths = new [] {"/kyoo", "/kyoo/Library/"}}
			});
			(Collection collection, Show show, Season season, Episode episode) = await _identifier.Identify(
				"/kyoo/Library/Collection/Show (2000)/Show.extension");
			Assert.Equal("Collection", collection.Name);
			Assert.Equal("collection", collection.Slug);
			Assert.Equal("Show", show.Title);
			Assert.Equal("show", show.Slug);
			Assert.Equal(2000, show.StartAir!.Value.Year);
			Assert.Null(season);
			Assert.True(show.IsMovie);
			Assert.Null(episode.SeasonNumber);
			Assert.Null(episode.EpisodeNumber);
			Assert.Null(episode.AbsoluteNumber);
		}
		
		[Fact]
		public async Task InvalidEpisodeIdentification()
		{
			_manager.Setup(x => x.GetAll(null, new Sort<Library>(), default)).ReturnsAsync(new[]
			{
				new Library {Paths = new [] {"/kyoo", "/kyoo/Library/"}}
			});
			await Assert.ThrowsAsync<IdentificationFailedException>(() => _identifier.Identify("/invalid/path"));
		}
		
		[Fact]
		public async Task SubtitleIdentification()
		{
			_manager.Setup(x => x.GetAll(null, new Sort<Library>(), default)).ReturnsAsync(new[]
			{
				new Library {Paths = new [] {"/kyoo", "/kyoo/Library/"}}
			});
			Track track = await _identifier.IdentifyTrack("/kyoo/Library/Collection/Show (2000)/Show.eng.default.str");
			Assert.True(track.IsExternal);
			Assert.Equal("eng", track.Language);
			Assert.Equal("subrip", track.Codec);
			Assert.True(track.IsDefault);
			Assert.False(track.IsForced);
			Assert.StartsWith("/kyoo/Library/Collection/Show (2000)/Show", track.Episode.Path);
		}
		
		[Fact]
		public async Task SubtitleIdentificationUnknownCodec()
		{
			_manager.Setup(x => x.GetAll(null, new Sort<Library>(), default)).ReturnsAsync(new[]
			{
				new Library {Paths = new [] {"/kyoo", "/kyoo/Library/"}}
			});
			Track track = await _identifier.IdentifyTrack("/kyoo/Library/Collection/Show (2000)/Show.eng.default.extension");
			Assert.True(track.IsExternal);
			Assert.Equal("eng", track.Language);
			Assert.Equal("extension", track.Codec);
			Assert.True(track.IsDefault);
			Assert.False(track.IsForced);
			Assert.StartsWith("/kyoo/Library/Collection/Show (2000)/Show", track.Episode.Path);
		}
		
		[Fact]
		public async Task InvalidSubtitleIdentification()
		{
			_manager.Setup(x => x.GetAll(null, new Sort<Library>(), default)).ReturnsAsync(new[]
			{
				new Library {Paths = new [] {"/kyoo", "/kyoo/Library/"}}
			});
			await Assert.ThrowsAsync<IdentificationFailedException>(() => _identifier.IdentifyTrack("/invalid/path"));
		}
	}
}