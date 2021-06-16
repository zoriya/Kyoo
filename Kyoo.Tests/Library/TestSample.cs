using System;
using System.Collections.Generic;
using Kyoo.Models;

namespace Kyoo.Tests
{
	public static class TestSample
	{
		private static readonly Dictionary<Type, Func<object>> Samples = new()
		{
			{
				typeof(Show),
				() => new Show
				{
					ID = 1,
					Slug = "anohana",
					Title = "Anohana: The Flower We Saw That Day",
					Aliases = new[]
					{
						"Ano Hi Mita Hana no Namae o Bokutachi wa Mada Shiranai.",
						"AnoHana",
						"We Still Don't Know the Name of the Flower We Saw That Day."
					},
					Overview = "When Yadomi Jinta was a child, he was a central piece in a group of close friends. " +
					           "In time, however, these childhood friends drifted apart, and when they became high " +
					           "school students, they had long ceased to think of each other as friends.",
					Status = Status.Finished,
					TrailerUrl = null,
					StartAir = new DateTime(2011),
					EndAir = new DateTime(2011),
					Poster = "poster",
					Logo = "logo",
					Backdrop = "backdrop",
					IsMovie = false,
					Studio = null
				}
			},
			{
				typeof(Season),
				() => new Season
				{
					ID = 1,
					ShowSlug = "anohana",
					ShowID = 1,
					SeasonNumber = 1,
					Title = "Season 1",
					Overview = "The first season",
					StartDate = new DateTime(2020, 06, 05),
					EndDate =  new DateTime(2020, 07, 05),
					Poster = "poster"
				}
			},
			{
				typeof(Episode),
				() => new Episode
				{
					ID = 1,
					ShowSlug = "anohana",
					ShowID = 1,
					SeasonID = 1,
					SeasonNumber = 1,
					EpisodeNumber = 1,
					AbsoluteNumber = 1,
					Path = "/home/kyoo/anohana-s1e1",
					Thumb = "thumbnail",
					Title = "Episode 1",
					Overview = "Summary of the first episode",
					ReleaseDate = new DateTime(2020, 06, 05)
				}
			},
			{
				typeof(People),
				() => new People
				{
					ID = 1,
					Slug = "the-actor",
					Name = "The Actor",
					Poster = "NicePoster"
				}
			}
		};
		
		public static T Get<T>()
		{
			return (T)Samples[typeof(T)]();
		}

		public static void FillDatabase(DatabaseContext context)
		{
			context.Shows.Add(Get<Show>());
			context.Seasons.Add(Get<Season>());
			// context.Episodes.Add(Get<Episode>());
			// context.People.Add(Get<People>());
			context.SaveChanges();
		}
	}
}