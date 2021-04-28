using System;
using Kyoo.Models;
using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.Logging;
using Npgsql;

namespace Kyoo.Postgresql
{
	/// <summary>
	/// A postgresql implementation of <see cref="DatabaseContext"/>.
	/// </summary>
	public class PostgresContext : DatabaseContext
	{
		/// <summary>
		/// The connection string to use.
		/// </summary>
		private readonly string _connection;

		/// <summary>
		/// Is this instance in debug mode?
		/// </summary>
		private readonly bool _debugMode;
		
		/// <summary>
		/// A basic constructor that set default values (query tracker behaviors, mapping enums...)
		/// </summary>
		public PostgresContext()
		{
			NpgsqlConnection.GlobalTypeMapper.MapEnum<Status>();
			NpgsqlConnection.GlobalTypeMapper.MapEnum<ItemType>();
			NpgsqlConnection.GlobalTypeMapper.MapEnum<StreamType>();
		}

		/// <summary>
		/// A basic constructor that set default values (query tracker behaviors, mapping enums...)
		/// </summary>
		/// <param name="connection">The connection string to use</param>
		/// <param name="debugMode">Is this instance in debug mode?</param>
		public PostgresContext(string connection, bool debugMode)
		{
			_connection = connection;
			_debugMode = debugMode;
		}

		/// <summary>
		/// Set connection information for this database context
		/// </summary>
		/// <param name="optionsBuilder">An option builder to fill.</param>
		protected override void OnConfiguring(DbContextOptionsBuilder optionsBuilder)
		{
			optionsBuilder.UseNpgsql(_connection);
			if (_debugMode)
				optionsBuilder.EnableDetailedErrors()
					.EnableSensitiveDataLogging();
		}

		/// <summary>
		/// Set database parameters to support every types of Kyoo.
		/// </summary>
		/// <param name="modelBuilder">The database's model builder.</param>
		protected override void OnModelCreating(ModelBuilder modelBuilder)
		{
			modelBuilder.HasPostgresEnum<Status>();
			modelBuilder.HasPostgresEnum<ItemType>();
			modelBuilder.HasPostgresEnum<StreamType>();
			
			base.OnModelCreating(modelBuilder);
		}

		/// <inheritdoc />
		protected override bool IsDuplicateException(Exception ex)
		{
			return ex.InnerException is PostgresException {SqlState: PostgresErrorCodes.UniqueViolation};
		}
	}
}