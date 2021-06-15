using System;
using System.Threading.Tasks;
using Kyoo.SqLite;
using Microsoft.Data.Sqlite;
using Microsoft.EntityFrameworkCore;
using Xunit;

namespace Kyoo.Tests
{
	public sealed class SqLiteTestContext : TestContext
	{
		/// <summary>
		/// The internal sqlite connection used by all context returned by this class.
		/// </summary>
		private readonly SqliteConnection _connection;

		public SqLiteTestContext()
		{
			_connection = new SqliteConnection("DataSource=:memory:");
			_connection.Open();
			
			Context = new DbContextOptionsBuilder<DatabaseContext>()
				.UseSqlite(_connection)
				.Options;
			
			using DatabaseContext context = New();
			context.Database.Migrate();
		}
		
		public override void Dispose()
		{
			_connection.Close();
		}

		public override async ValueTask DisposeAsync()
		{
			await _connection.CloseAsync();
		}

		public override DatabaseContext New()
		{
			return new SqLiteContext(Context);
		}
	}

	[CollectionDefinition(nameof(Postgresql))]
	public class PostgresCollection : ICollectionFixture<PostgresFixture>
	{}

	public class PostgresFixture
	{
		
	}
	
	public sealed class PostgresTestContext : TestContext
	{
		private readonly PostgresFixture _template;
		
		public PostgresTestContext(PostgresFixture template)
		{
			_template = template;
		}
		
		public override void Dispose()
		{
			throw new NotImplementedException();
		}

		public override ValueTask DisposeAsync()
		{
			throw new NotImplementedException();
		}

		public override DatabaseContext New()
		{
			throw new NotImplementedException();
		}
	}
	
	
	/// <summary>
	/// Class responsible to fill and create in memory databases for unit tests.
	/// </summary>
	public abstract class TestContext : IDisposable, IAsyncDisposable
	{
		/// <summary>
		/// The context's options that specify to use an in memory Sqlite database.
		/// </summary>
		protected DbContextOptions<DatabaseContext> Context;

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
		public abstract DatabaseContext New();

		public abstract void Dispose();

		public abstract ValueTask DisposeAsync();
	}
}
