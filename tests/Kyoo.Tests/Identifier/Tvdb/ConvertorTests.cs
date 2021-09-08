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
using System.Linq;
using Kyoo.Abstractions.Models;
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
			Assert.Equal("https://www.thetvdb.com/poster", show.Images[Images.Poster]);
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
			Assert.Equal("https://www.thetvdb.com/poster", show.Images[Images.Poster]);
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
				Genre = new[]
				{
					"Action",
					"Test With Sp??acial characters"
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
			Assert.Equal("https://www.thetvdb.com/banners/poster", show.Images[Images.Poster]);
			Assert.Equal("https://www.thetvdb.com/banners/fanart", show.Images[Images.Thumbnail]);
			Assert.Single(show.ExternalIDs);
			Assert.Equal("5", show.ExternalIDs.First().DataID);
			Assert.Equal(provider, show.ExternalIDs.First().Provider);
			Assert.Equal("https://www.thetvdb.com/series/slug", show.ExternalIDs.First().Link);
			Assert.Equal(Status.Airing, show.Status);
			Assert.Equal(2, show.Genres.Count);
			Assert.Equal("action", show.Genres.ToArray()[0].Slug);
			Assert.Equal("Action", show.Genres.ToArray()[0].Name);
			Assert.Equal("Test With Sp??acial characters", show.Genres.ToArray()[1].Name);
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
			PeopleRole people = actor.ToPeopleRole();

			Assert.Equal("name", people.Slug);
			Assert.Equal("Name", people.People.Name);
			Assert.Equal("role", people.Role);
			Assert.Equal("https://www.thetvdb.com/banners/image", people.People.Images[Images.Poster]);
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
			Assert.Equal("https://www.thetvdb.com/banners/thumb", episode.Images[Images.Thumbnail]);
		}
	}
}
