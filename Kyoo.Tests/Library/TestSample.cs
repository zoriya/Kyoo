using System;
using System.Collections.Generic;
using Kyoo.Models;

namespace Kyoo.Tests
{
	public static class TestSample
	{
		private static readonly Dictionary<Type, object> Samples = new()
		{
			{
				typeof(Show),
				new Show
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
					StartYear = 2011,
					EndYear = 2011,
					Poster = "poster",
					Logo = "logo",
					Backdrop = "backdrop",
					IsMovie = false,
					Studio = null
				}
			}
		};
		
		public static T Get<T>()
		{
			return (T)Samples[typeof(T)];
		}
	}
}