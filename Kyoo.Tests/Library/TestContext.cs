using System;
using System.Threading.Tasks;
using Kyoo.SqLite;
using Microsoft.Data.Sqlite;
using Microsoft.EntityFrameworkCore;

namespace Kyoo.Tests
{
	/// <summary>
	/// Class responsible to fill and create in memory databases for unit tests.
	/// </summary>
	public class TestContext : IDisposable, IAsyncDisposable
	{
		/// <summary>
		/// The context's options that specify to use an in memory Sqlite database.
		/// </summary>
		private readonly DbContextOptions<DatabaseContext> _context;

		/// <summary>
		/// The internal sqlite connection used by all context returned by this class.
		/// </summary>
		private readonly SqliteConnection _connection;
		
		/// <summary>
		/// Create a new database and fill it with information.
		/// </summary>
		public TestContext()
		{
			_connection = new SqliteConnection("DataSource=:memory:");
			_connection.Open();

			_context = new DbContextOptionsBuilder<DatabaseContext>()
				.UseSqlite(_connection)
				.Options;
			
			using DatabaseContext context = New();
			context.Database.Migrate();
		}

		/// <summary>
		/// Fill the database with pre defined values using a clean context.
		/// </summary>
		public void AddTest<T>() 
			where T : class
		{
			using DatabaseContext context = New();
			context.Set<T>().Add(TestSample.Get<T>());
			context.SaveChanges();
		}
		
		/// <summary>
		/// Fill the database with pre defined values using a clean context.
		/// </summary>
		public async Task AddTestAsync<T>() 
			where T : class
		{
			await using DatabaseContext context = New();
			await context.Set<T>().AddAsync(TestSample.Get<T>());
			await context.SaveChangesAsync();
		}
		
		/// <summary>
		/// Add an arbitrary data to the test context.
		/// </summary>
		public void Add<T>(T obj) 
			where T : class
		{
			using DatabaseContext context = New();
			context.Set<T>().Add(obj);
			context.SaveChanges();
		}
		
		/// <summary>
		/// Add an arbitrary data to the test context.
		/// </summary>
		public async Task AddAsync<T>(T obj) 
			where T : class
		{
			await using DatabaseContext context = New();
			await context.Set<T>().AddAsync(obj);
			await context.SaveChangesAsync();
		}

		/// <summary>
		/// Get a new database context connected to a in memory Sqlite database.
		/// </summary>
		/// <returns>A valid DatabaseContext</returns>
		public DatabaseContext New()
		{
			return new SqLiteContext(_context);
		}

		public void Dispose()
		{
			_connection.Close();
			GC.SuppressFinalize(this);
		}

		public async ValueTask DisposeAsync()
		{
			await _connection.CloseAsync();
		}
	}
}
