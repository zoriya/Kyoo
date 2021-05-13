// using Kyoo.Models;
// using Microsoft.Data.Sqlite;
// using Microsoft.EntityFrameworkCore;
//
// namespace Kyoo.Tests
// {
// 	/// <summary>
// 	/// Class responsible to fill and create in memory databases for unit tests.
// 	/// </summary>
// 	public class TestContext
// 	{
// 		/// <summary>
// 		/// The context's options that specify to use an in memory Sqlite database.
// 		/// </summary>
// 		private readonly DbContextOptions<DatabaseContext> _context;
// 		
// 		/// <summary>
// 		/// Create a new database and fill it with information.
// 		/// </summary>
// 		public TestContext()
// 		{
// 			SqliteConnection connection = new("DataSource=:memory:");
// 			connection.Open();
//
// 			try
// 			{
// 				_context = new DbContextOptionsBuilder<DatabaseContext>()
// 					.UseSqlite(connection)
// 					.Options;
// 				FillDatabase();
// 			}
// 			finally
// 			{
// 				connection.Close();
// 			}
// 		}
//
// 		/// <summary>
// 		/// Fill the database with pre defined values using a clean context.
// 		/// </summary>
// 		private void FillDatabase()
// 		{
// 			using DatabaseContext context = new(_context);
// 			context.Shows.Add(new Show
// 			{
// 				ID = 67,
// 				Slug = "anohana",
// 				Title = "Anohana: The Flower We Saw That Day",
// 				Aliases = new[]
// 				{
// 					"Ano Hi Mita Hana no Namae o Bokutachi wa Mada Shiranai.",
// 					"AnoHana",
// 					"We Still Don't Know the Name of the Flower We Saw That Day."
// 				},
// 				Overview = "When Yadomi Jinta was a child, he was a central piece in a group of close friends. " +
// 				           "In time, however, these childhood friends drifted apart, and when they became high " +
// 				           "school students, they had long ceased to think of each other as friends.",
// 				Status = Status.Finished,
// 				TrailerUrl = null,
// 				StartYear = 2011,
// 				EndYear = 2011,
// 				Poster = "poster",
// 				Logo = "logo",
// 				Backdrop = "backdrop",
// 				IsMovie = false,
// 				Studio = null
// 			});
// 		}
//
// 		/// <summary>
// 		/// Get a new database context connected to a in memory Sqlite database.
// 		/// </summary>
// 		/// <returns>A valid DatabaseContext</returns>
// 		public DatabaseContext New()
// 		{
// 			return new(_context);
// 		}
// 	}
// }