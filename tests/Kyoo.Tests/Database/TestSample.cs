using System;
using System.Collections.Generic;
using Kyoo.Abstractions.Models;
using Kyoo.Database;

namespace Kyoo.Tests
{
	public static class TestSample
	{
		private static readonly Dictionary<Type, Func<object>> NewSamples = new()
		{
			{
				typeof(Library),
				() => new Library
				{
					ID = 2,
					Slug = "new-library",
					Name = "New Library",
					Paths = new[] { "/a/random/path" }
				}
			},
			{
				typeof(Collection),
				() => new Collection
				{
					ID = 2,
					Slug = "new-collection",
					Name = "New Collection",
					Overview = "A collection created by new sample",
					Images = new Dictionary<int, string>
					{
						[Images.Thumbnail] = "thumbnail"
					}
				}
			},
			{
				typeof(Show),
				() => new Show
				{
					ID = 2,
					Slug = "new-show",
					Title = "New Show",
					Overview = "overview",
					Status = Status.Planned,
					StartAir = new DateTime(2011, 1, 1),
					EndAir = new DateTime(2011, 1, 1),
					Images = new Dictionary<int, string>
					{
						[Images.Poster] = "Poster",
						[Images.Logo] = "Logo",
						[Images.Thumbnail] = "Thumbnail"
					},
					IsMovie = false,
					Studio = null
				}
			},
			{
				typeof(Season),
				() => new Season
				{
					ID = 2,
					ShowID = 1,
					ShowSlug = Get<Show>().Slug,
					Title = "New season",
					Overview = "New overview",
					EndDate = new DateTime(2000, 10, 10),
					SeasonNumber = 2,
					StartDate = new DateTime(2010, 10, 10),
					Images = new Dictionary<int, string>
					{
						[Images.Logo] = "logo"
					}
				}
			},
			{
				typeof(Episode),
				() => new Episode
				{
					ID = 2,
					ShowID = 1,
					ShowSlug = Get<Show>().Slug,
					SeasonID = 1,
					SeasonNumber = Get<Season>().SeasonNumber,
					EpisodeNumber = 3,
					AbsoluteNumber = 4,
					Path = "/episode-path",
					Title = "New Episode Title",
					ReleaseDate = new DateTime(2000, 10, 10),
					Overview = "new episode overview",
					Images = new Dictionary<int, string>
					{
						[Images.Logo] = "new episode logo"
					}
				}
			},
			{
				typeof(Provider),
				() => new Provider
				{
					ID = 2,
					Slug = "new-provider",
					Name = "Provider NewSample",
					Images = new Dictionary<int, string>
					{
						[Images.Logo] = "logo"
					}
				}
			},
			{
				typeof(People),
				() => new People
				{
					ID = 2,
					Slug = "new-person-name",
					Name = "New person name",
					Images = new Dictionary<int, string>
					{
						[Images.Logo] = "Old Logo",
						[Images.Poster] = "Old poster"
					}
				}
			}
		};

		private static readonly Dictionary<Type, Func<object>> Samples = new()
		{
			{
				typeof(Library),
				() => new Library
				{
					ID = 1,
					Slug = "deck",
					Name = "Deck",
					Paths = new[] { "/path/to/deck" }
				}
			},
			{
				typeof(Collection),
				() => new Collection
				{
					ID = 1,
					Slug = "collection",
					Name = "Collection",
					Overview = "A nice collection for tests",
					Images = new Dictionary<int, string>
					{
						[Images.Poster] = "Poster"
					}
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
					StudioID = 1,
					StartAir = new DateTime(2011, 1, 1),
					EndAir = new DateTime(2011, 1, 1),
					Images = new Dictionary<int, string>
					{
						[Images.Poster] = "Poster",
						[Images.Logo] = "Logo",
						[Images.Thumbnail] = "Thumbnail"
					},
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
					EndDate = new DateTime(2020, 07, 05),
					Images = new Dictionary<int, string>
					{
						[Images.Poster] = "Poster",
						[Images.Logo] = "Logo",
						[Images.Thumbnail] = "Thumbnail"
					},
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
					Images = new Dictionary<int, string>
					{
						[Images.Poster] = "Poster",
						[Images.Logo] = "Logo",
						[Images.Thumbnail] = "Thumbnail"
					},
					Title = "Episode 1",
					Overview = "Summary of the first episode",
					ReleaseDate = new DateTime(2020, 06, 05)
				}
			},
			{
				typeof(Track),
				() => new Track
				{
					ID = 1,
					EpisodeID = 1,
					Codec = "subrip",
					Language = "eng",
					Path = "/path",
					Title = "Subtitle track",
					Type = StreamType.Subtitle,
					EpisodeSlug = Get<Episode>().Slug,
					IsDefault = true,
					IsExternal = false,
					IsForced = false,
					TrackIndex = 1
				}
			},
			{
				typeof(People),
				() => new People
				{
					ID = 1,
					Slug = "the-actor",
					Name = "The Actor",
					Images = new Dictionary<int, string>
					{
						[Images.Poster] = "Poster",
						[Images.Logo] = "Logo",
						[Images.Thumbnail] = "Thumbnail"
					},
				}
			},
			{
				typeof(Studio),
				() => new Studio
				{
					ID = 1,
					Slug = "hyper-studio",
					Name = "Hyper studio",
				}
			},
			{
				typeof(Genre),
				() => new Genre
				{
					ID = 1,
					Slug = "action",
					Name = "Action"
				}
			},
			{
				typeof(Provider),
				() => new Provider
				{
					ID = 1,
					Slug = "tvdb",
					Name = "The TVDB",
					Images = new Dictionary<int, string>
					{
						[Images.Poster] = "Poster",
						[Images.Logo] = "path/tvdb.svg",
						[Images.Thumbnail] = "Thumbnail"
					}
				}
			},
			{
				typeof(User),
				() => new User
				{
					ID = 1,
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
			collection.ID = 0;
			context.Collections.Add(collection);

			Show show = Get<Show>();
			show.ID = 0;
			show.StudioID = 0;
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

			Track track = Get<Track>();
			track.ID = 0;
			track.EpisodeID = 0;
			track.Episode = episode;
			context.Tracks.Add(track);

			Studio studio = Get<Studio>();
			studio.ID = 0;
			studio.Shows = new List<Show> { show };
			context.Studios.Add(studio);

			Genre genre = Get<Genre>();
			genre.ID = 0;
			genre.Shows = new List<Show> { show };
			context.Genres.Add(genre);

			People people = Get<People>();
			people.ID = 0;
			context.People.Add(people);

			Provider provider = Get<Provider>();
			provider.ID = 0;
			context.Providers.Add(provider);

			Library library = Get<Library>();
			library.ID = 0;
			library.Collections = new List<Collection> { collection };
			library.Providers = new List<Provider> { provider };
			context.Libraries.Add(library);

			User user = Get<User>();
			user.ID = 0;
			context.Users.Add(user);

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
				Images = new Dictionary<int, string>
				{
					[Images.Poster] = "Poster",
					[Images.Logo] = "Logo",
					[Images.Thumbnail] = "Thumbnail"
				},
				Title = "Episode 3",
				Overview = "Summary of the third absolute episode",
				ReleaseDate = new DateTime(2020, 06, 05)
			};
		}

		public static Episode GetMovieEpisode()
		{
			return new()
			{
				ID = 3,
				ShowSlug = "anohana",
				ShowID = 1,
				Path = "/home/kyoo/john-wick",
				Images = new Dictionary<int, string>
				{
					[Images.Poster] = "Poster",
					[Images.Logo] = "Logo",
					[Images.Thumbnail] = "Thumbnail"
				},
				Title = "John wick",
				Overview = "A movie episode test",
				ReleaseDate = new DateTime(1595, 05, 12)
			};
		}
	}
}
