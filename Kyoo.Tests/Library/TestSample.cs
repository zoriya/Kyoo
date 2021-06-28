using System;
using System.Collections.Generic;
using Kyoo.Models;

namespace Kyoo.Tests
{
	public static class TestSample
	{
		private static readonly Dictionary<Type, Func<object>> NewSamples = new()
		{
			{
				typeof(Show),
				() => new Show()
			}
		};
		
		
		private static readonly Dictionary<Type, Func<object>> Samples = new()
		{
			{
				typeof(Collection),
				() => new Collection
				{
					ID = 1,
					Slug = "collection",
					Name = "Collection",
					Overview = "A nice collection for tests",
					Poster = "Poster"
				}
			},
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
					StartAir = new DateTime(2011, 1, 1),
					EndAir = new DateTime(2011, 1, 1),
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
		
		public static T GetNew<T>()
		{
			return (T)NewSamples[typeof(T)]();
		}

		public static void FillDatabase(DatabaseContext context)
		{
			Collection collection = Get<Collection>();
			collection.ID = 0;
			context.Collections.Add(collection);
			
			Show show = Get<Show>();
			show.ID = 0;
			context.Shows.Add(show);

			Season season = Get<Season>();
			season.ID = 0;
			season.ShowID = 0;
			season.Show = show;
			context.Seasons.Add(season);

			Episode episode = Get<Episode>();
			episode.ID = 0;
			episode.ShowID = 0;
			episode.Show = show;
			episode.SeasonID = 0;
			episode.Season = season;
			context.Episodes.Add(episode);
			
			context.SaveChanges();
		}

		public static Episode GetAbsoluteEpisode()
		{
			return new()
			{
				ID = 2,
				ShowSlug = "anohana",
				ShowID = 1,
				SeasonNumber = null,
				EpisodeNumber = null,
				AbsoluteNumber = 3,
				Path = "/home/kyoo/anohana-3",
				Thumb = "thumbnail",
				Title = "Episode 3",
				Overview = "Summary of the third absolute episode",
				ReleaseDate = new DateTime(2020, 06, 05)
			};
		}
	}
}