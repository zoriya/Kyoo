using System;
using System.Linq;
using Kyoo.Postgresql;
using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.Configuration;

public class DbConfigurationProvider(Action<DbContextOptionsBuilder> action) : ConfigurationProvider
{
	public override void Load()
	{
		DbContextOptionsBuilder<PostgresContext> builder = new();
		action(builder);
		using var context = new PostgresContext(builder.Options, null!);
		Data = context.Options.ToDictionary(c => c.Key, c => c.Value)!;
	}
}

public class DbConfigurationSource(Action<DbContextOptionsBuilder> action) : IConfigurationSource
{
	public IConfigurationProvider Build(IConfigurationBuilder builder) =>
		new DbConfigurationProvider(action);
}

public class ServerOption
{
	public string Key { get; set; }
	public string Value { get; set; }
}
