using System;
using System.Linq;
using Kyoo.Models;
using Kyoo.TheTvdb;
using TvDbSharper.Dto;
using Xunit;

namespace Kyoo.Tests.Identifier.Tvdb
{
	public class ConvertorTests
	{
		[Fact]
		public void SeriesSearchToShow()
		{
			SeriesSearchResult result = new()
			{
				Slug = "slug",
				SeriesName = "name",
				Aliases = new[] { "Aliases" },
				Overview = "overview",
				Status = "Ended",
				FirstAired = "2021-07-23",
				Poster = "/poster",
				Id = 5
			};
			Provider provider = TestSample.Get<Provider>();
			Show show = result.ToShow(provider);
			
			Assert.Equal("slug", show.Slug);
			Assert.Equal("name", show.Title);
			Assert.Single(show.Aliases);
			Assert.Equal("Aliases", show.Aliases[0]);
			Assert.Equal("overview", show.Overview);
			Assert.Equal(new DateTime(2021, 7, 23), show.StartAir);
			Assert.Equal("https://www.thetvdb.com/poster", show.Poster);
			Assert.Single(show.ExternalIDs);
			Assert.Equal("5", show.ExternalIDs.First().DataID);
			Assert.Equal(provider, show.ExternalIDs.First().Provider);
			Assert.Equal("https://www.thetvdb.com/series/slug", show.ExternalIDs.First().Link);
			Assert.Equal(Status.Finished, show.Status);
		}

		[Fact]
		public void SeriesSearchToShowInvalidDate()
		{
			SeriesSearchResult result = new()
			{
				Slug = "slug",
				SeriesName = "name",
				Aliases = new[] { "Aliases" },
				Overview = "overview",
				Status = "ad",
				FirstAired = "2e021-07-23",
				Poster = "/poster",
				Id = 5
			};
			Provider provider = TestSample.Get<Provider>();
			Show show = result.ToShow(provider);

			Assert.Equal("slug", show.Slug);
			Assert.Equal("name", show.Title);
			Assert.Single(show.Aliases);
			Assert.Equal("Aliases", show.Aliases[0]);
			Assert.Equal("overview", show.Overview);
			Assert.Null(show.StartAir);
			Assert.Equal("https://www.thetvdb.com/poster", show.Poster);
			Assert.Single(show.ExternalIDs);
			Assert.Equal("5", show.ExternalIDs.First().DataID);
			Assert.Equal(provider, show.ExternalIDs.First().Provider);
			Assert.Equal("https://www.thetvdb.com/series/slug", show.ExternalIDs.First().Link);
			Assert.Equal(Status.Unknown, show.Status);
		}

		[Fact]
		public void SeriesToShow()
		{
			Series result = new()
			{
				Slug = "slug",
				SeriesName = "name",
				Aliases = new[] { "Aliases" },
				Overview = "overview",
				Status = "Continuing",
				FirstAired = "2021-07-23",
				Poster = "poster",
				FanArt = "fanart",
				Id = 5,
				Genre = new []
				{
					"Action",
					"Test With Spéàacial characters"
				}
			};
			Provider provider = TestSample.Get<Provider>();
			Show show = result.ToShow(provider);
			
			Assert.Equal("slug", show.Slug);
			Assert.Equal("name", show.Title);
			Assert.Single(show.Aliases);
			Assert.Equal("Aliases", show.Aliases[0]);
			Assert.Equal("overview", show.Overview);
			Assert.Equal(new DateTime(2021, 7, 23), show.StartAir);
			Assert.Equal("https://www.thetvdb.com/banners/poster", show.Poster);
			Assert.Equal("https://www.thetvdb.com/banners/fanart", show.Backdrop);
			Assert.Single(show.ExternalIDs);
			Assert.Equal("5", show.ExternalIDs.First().DataID);
			Assert.Equal(provider, show.ExternalIDs.First().Provider);
			Assert.Equal("https://www.thetvdb.com/series/slug", show.ExternalIDs.First().Link);
			Assert.Equal(Status.Airing, show.Status);
			Assert.Equal(2, show.Genres.Count);
			Assert.Equal("action", show.Genres.ToArray()[0].Slug);
			Assert.Equal("Action", show.Genres.ToArray()[0].Name);
			Assert.Equal("Test With Spéàacial characters", show.Genres.ToArray()[1].Name);
			Assert.Equal("test-with-speaacial-characters", show.Genres.ToArray()[1].Slug);
		}

		[Fact]
		public void ActorToPeople()
		{
			Actor actor = new()
			{
				Id = 5,
				Image = "image",
				Name = "Name",
				Role = "role"
			};
			Provider provider = TestSample.Get<Provider>();
			PeopleRole people = actor.ToPeopleRole(provider);
			
			Assert.Equal("name", people.Slug);
			Assert.Equal("Name", people.People.Name);
			Assert.Equal("role", people.Role);
			Assert.Equal("https://www.thetvdb.com/banners/image", people.People.Poster);
		}
		
		[Fact]
		public void EpisodeRecordToEpisode()
		{
			EpisodeRecord record = new()
			{
				Id = 5,
				AiredSeason = 2,
				AiredEpisodeNumber = 3,
				AbsoluteNumber = 23,
				EpisodeName = "title",
				Overview = "overview",
				Filename = "thumb"
			};
			Provider provider = TestSample.Get<Provider>();
			Episode episode = record.ToEpisode(provider);
			
			Assert.Equal("title", episode.Title);
			Assert.Equal(2, episode.SeasonNumber);
			Assert.Equal(3, episode.EpisodeNumber);
			Assert.Equal(23, episode.AbsoluteNumber);
			Assert.Equal("overview", episode.Overview);
			Assert.Equal("https://www.thetvdb.com/banners/thumb", episode.Thumb);
		}
	}
}