using System;
using System.Threading.Tasks;
using Kyoo.Database;
using Kyoo.Postgresql;
using Kyoo.SqLite;
using Microsoft.Data.Sqlite;
using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.Logging;
using Npgsql;
using Xunit;
using Xunit.Abstractions;

namespace Kyoo.Tests
{
	public sealed class SqLiteTestContext : TestContext
	{
		/// <summary>
		/// The internal sqlite connection used by all context returned by this class.
		/// </summary>
		private readonly SqliteConnection _connection;
		
		/// <summary>
		/// The context's options that specify to use an in memory Sqlite database.
		/// </summary>
		private readonly DbContextOptions<DatabaseContext> _context;

		public SqLiteTestContext(ITestOutputHelper output)
		{
			_connection = new SqliteConnection("DataSource=:memory:");
			_connection.Open();
			
			_context = new DbContextOptionsBuilder<DatabaseContext>()
				.UseSqlite(_connection)
				.UseLoggerFactory(LoggerFactory.Create(x =>
				{
					x.ClearProviders();
					x.AddXunit(output);
				}))
				.EnableSensitiveDataLogging()
				.EnableDetailedErrors()
				.Options;
			
			using DatabaseContext context = New();
			context.Database.Migrate();
			TestSample.FillDatabase(context);
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
			return new SqLiteContext(_context);
		}
	}
	
	[CollectionDefinition(nameof(Postgresql))]
	public class PostgresCollection : ICollectionFixture<PostgresFixture>
	{}

	public sealed class PostgresFixture : IDisposable
	{
		private readonly DbContextOptions<DatabaseContext> _options;
		
		public string Template { get; }

		public string Connection => PostgresTestContext.GetConnectionString(Template);
		
		public PostgresFixture()
		{
			// TODO Assert.Skip when postgres is not available. (this needs xunit v3)
			
			string id = Guid.NewGuid().ToString().Replace('-', '_');
			Template = $"kyoo_template_{id}";
			
			_options = new DbContextOptionsBuilder<DatabaseContext>()
				.UseNpgsql(Connection)
				.Options;
			
			using PostgresContext context = new(_options);
			context.Database.Migrate();

			using NpgsqlConnection conn = (NpgsqlConnection)context.Database.GetDbConnection();
			conn.Open();
			conn.ReloadTypes();

			TestSample.FillDatabase(context);
			conn.Close();
		}
		
		public void Dispose()
		{
			using PostgresContext context = new(_options);
			context.Database.EnsureDeleted();
		}
	}
	
	public sealed class PostgresTestContext : TestContext
	{
		private readonly NpgsqlConnection _connection;
		private readonly DbContextOptions<DatabaseContext> _context;
		
		public PostgresTestContext(PostgresFixture template, ITestOutputHelper output)
		{
			string id = Guid.NewGuid().ToString().Replace('-', '_');
			string database = $"kyoo_test_{id}";

			using (NpgsqlConnection connection = new(template.Connection))
			{
				connection.Open();
				using NpgsqlCommand cmd = new($"CREATE DATABASE {database} WITH TEMPLATE {template.Template}", connection);
				cmd.ExecuteNonQuery();
			}

			_connection = new NpgsqlConnection(GetConnectionString(database));
			_connection.Open();

			_context = new DbContextOptionsBuilder<DatabaseContext>()
				.UseNpgsql(_connection)
				.UseLoggerFactory(LoggerFactory.Create(x =>
				{
					x.ClearProviders();
					x.AddXunit(output);
				}))
				.EnableSensitiveDataLogging()
				.EnableDetailedErrors()
				.Options;
		}
		
		public static string GetConnectionString(string database)
		{
			string server = Environment.GetEnvironmentVariable("POSTGRES_HOST") ?? "127.0.0.1";
			string port = Environment.GetEnvironmentVariable("POSTGRES_PORT") ?? "5432";
			string username = Environment.GetEnvironmentVariable("POSTGRES_USERNAME") ?? "kyoo";
			string password = Environment.GetEnvironmentVariable("POSTGRES_PASSWORD") ?? "kyooPassword";
			return $"Server={server};Port={port};Database={database};User ID={username};Password={password};Include Error Detail=true";
		}
		
		public override void Dispose()
		{
			using DatabaseContext db = New();
			db.Database.EnsureDeleted();
			_connection.Close();
		}

		public override async ValueTask DisposeAsync()
		{
			await using DatabaseContext db = New();
			await db.Database.EnsureDeletedAsync();
			await _connection.CloseAsync();
		}

		public override DatabaseContext New()
		{
			return new PostgresContext(_context);
		}
	}
	
	
	/// <summary>
	/// Class responsible to fill and create in memory databases for unit tests.
	/// </summary>
	public abstract class TestContext : IDisposable, IAsyncDisposable
	{
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
