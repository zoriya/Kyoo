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
using System.Collections.Generic;
using Kyoo.Abstractions.Models;
using Kyoo.Postgresql;

namespace Kyoo.Tests
{
	public static class TestSample
	{
		private static readonly Dictionary<Type, Func<object>> NewSamples = new()
		{
			{
				typeof(Collection),
				() => new Collection
				{
					Id = 2,
					Slug = "new-collection",
					Name = "New Collection",
					Overview = "A collection created by new sample",
					Thumbnail = new Image("thumbnail")
				}
			},
			{
				typeof(Show),
				() => new Show
				{
					Id = 2,
					Slug = "new-show",
					Name = "New Show",
					Overview = "overview",
					Status = Status.Planned,
					StartAir = new DateTime(2011, 1, 1).ToUniversalTime(),
					EndAir = new DateTime(2011, 1, 1).ToUniversalTime(),
					Poster = new Image("Poster"),
					Logo = new Image("Logo"),
					Thumbnail = new Image("Thumbnail"),
					Studio = null
				}
			},
			{
				typeof(Season),
				() => new Season
				{
					Id = 2,
					ShowId = 1,
					ShowSlug = Get<Show>().Slug,
					Name = "New season",
					Overview = "New overview",
					EndDate = new DateTime(2000, 10, 10).ToUniversalTime(),
					SeasonNumber = 2,
					StartDate = new DateTime(2010, 10, 10).ToUniversalTime(),
					Logo = new Image("logo")
				}
			},
			{
				typeof(Episode),
				() => new Episode
				{
					Id = 2,
					ShowId = 1,
					ShowSlug = Get<Show>().Slug,
					SeasonId = 1,
					SeasonNumber = Get<Season>().SeasonNumber,
					EpisodeNumber = 3,
					AbsoluteNumber = 4,
					Path = "/episode-path",
					Name = "New Episode Title",
					ReleaseDate = new DateTime(2000, 10, 10).ToUniversalTime(),
					Overview = "new episode overview",
					Logo = new Image("new episode logo")
				}
			},
			{
				typeof(People),
				() => new People
				{
					Id = 2,
					Slug = "new-person-name",
					Name = "New person name",
					Logo = new Image("Old Logo"),
					Poster = new Image("Old poster")
				}
			}
		};

		private static readonly Dictionary<Type, Func<object>> Samples = new()
		{
			{
				typeof(Collection),
				() => new Collection
				{
					Id = 1,
					Slug = "collection",
					Name = "Collection",
					Overview = "A nice collection for tests",
					Poster = new Image("Poster")
				}
			},
			{
				typeof(Show),
				() => new Show
				{
					Id = 1,
					Slug = "anohana",
					Name = "Anohana: The Flower We Saw That Day",
					Aliases = new List<string>
					{
						"Ano Hi Mita Hana no Namae o Bokutachi wa Mada Shiranai.",
						"AnoHana",
						"We Still Don't Know the Name of the Flower We Saw That Day."
					},
					Overview = "When Yadomi Jinta was a child, he was a central piece in a group of close friends. " +
						"In time, however, these childhood friends drifted apart, and when they became high " +
						"school students, they had long ceased to think of each other as friends.",
					Status = Status.Finished,
					StudioId = 1,
					StartAir = new DateTime(2011, 1, 1).ToUniversalTime(),
					EndAir = new DateTime(2011, 1, 1).ToUniversalTime(),
					Poster = new Image("Poster"),
					Logo = new Image("Logo"),
					Thumbnail = new Image("Thumbnail"),
					Studio = null
				}
			},
			{
				typeof(Season),
				() => new Season
				{
					Id = 1,
					ShowSlug = "anohana",
					ShowId = 1,
					SeasonNumber = 1,
					Name = "Season 1",
					Overview = "The first season",
					StartDate = new DateTime(2020, 06, 05).ToUniversalTime(),
					EndDate = new DateTime(2020, 07, 05).ToUniversalTime(),
					Poster = new Image("Poster"),
					Logo = new Image("Logo"),
					Thumbnail = new Image("Thumbnail")
				}
			},
			{
				typeof(Episode),
				() => new Episode
				{
					Id = 1,
					ShowSlug = "anohana",
					ShowId = 1,
					SeasonId = 1,
					SeasonNumber = 1,
					EpisodeNumber = 1,
					AbsoluteNumber = 1,
					Path = "/home/kyoo/anohana-s1e1",
					Poster = new Image("Poster"),
					Logo = new Image("Logo"),
					Thumbnail = new Image("Thumbnail"),
					Name = "Episode 1",
					Overview = "Summary of the first episode",
					ReleaseDate = new DateTime(2020, 06, 05).ToUniversalTime()
				}
			},
			{
				typeof(People),
				() => new People
				{
					Id = 1,
					Slug = "the-actor",
					Name = "The Actor",
					Poster = new Image("Poster"),
					Logo = new Image("Logo"),
					Thumbnail = new Image("Thumbnail")
				}
			},
			{
				typeof(Studio),
				() => new Studio
				{
					Id = 1,
					Slug = "hyper-studio",
					Name = "Hyper studio",
				}
			},
			{
				typeof(User),
				() => new User
				{
					Id = 1,
					Slug = "user",
					Username = "User",
					Email = "user@im-a-user.com",
					Password = "MD5-encoded",
					Permissions = new[] { "overall.read" }
				}
			}
		};

		public static T Get<T>()
		{
			return (T)Samples[typeof(T)]();
		}

		public static T GetNew<T>()
		{
			return (T)NewSamples[typeof(T)]();
		}

		public static void FillDatabase(DatabaseContext context)
		{
			Collection collection = Get<Collection>();
			collection.Id = 0;
			context.Collections.Add(collection);

			Show show = Get<Show>();
			show.Id = 0;
			show.StudioId = 0;
			context.Shows.Add(show);

			Season season = Get<Season>();
			season.Id = 0;
			season.ShowId = 0;
			season.Show = show;
			context.Seasons.Add(season);

			Episode episode = Get<Episode>();
			episode.Id = 0;
			episode.ShowId = 0;
			episode.Show = show;
			episode.SeasonId = 0;
			episode.Season = season;
			context.Episodes.Add(episode);

			Studio studio = Get<Studio>();
			studio.Id = 0;
			studio.Shows = new List<Show> { show };
			context.Studios.Add(studio);

			People people = Get<People>();
			people.Id = 0;
			context.People.Add(people);

			User user = Get<User>();
			user.Id = 0;
			context.Users.Add(user);

			context.SaveChanges();
		}

		public static Episode GetAbsoluteEpisode()
		{
			return new()
			{
				Id = 2,
				ShowSlug = "anohana",
				ShowId = 1,
				SeasonNumber = null,
				EpisodeNumber = null,
				AbsoluteNumber = 3,
				Path = "/home/kyoo/anohana-3",
				Poster = new Image("Poster"),
				Logo = new Image("Logo"),
				Thumbnail = new Image("Thumbnail"),
				Name = "Episode 3",
				Overview = "Summary of the third absolute episode",
				ReleaseDate = new DateTime(2020, 06, 05).ToUniversalTime()
			};
		}
	}
}
