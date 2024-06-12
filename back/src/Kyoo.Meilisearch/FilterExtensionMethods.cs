using System.ComponentModel.DataAnnotations;
using Kyoo.Abstractions.Models.Utils;
using static System.Text.Json.JsonNamingPolicy;

namespace Kyoo.Meiliseach;

internal static class FilterExtensionMethods
{
	public static string? CreateMeilisearchFilter<T>(this Filter<T>? filter)
	{
		return filter switch
		{
			Filter<T>.And and
				=> $"({and.First.CreateMeilisearchFilter()}) AND ({and.Second.CreateMeilisearchFilter()})",
			Filter<T>.Or or
				=> $"({or.First.CreateMeilisearchFilter()}) OR ({or.Second.CreateMeilisearchFilter()})",
			Filter<T>.Gt gt => CreateBasicFilterString(gt.Property, ">", gt.Value),
			Filter<T>.Lt lt => CreateBasicFilterString(lt.Property, "<", lt.Value),
			Filter<T>.Ge ge => CreateBasicFilterString(ge.Property, ">=", ge.Value),
			Filter<T>.Le le => CreateBasicFilterString(le.Property, "<=", le.Value),
			Filter<T>.Eq eq => CreateBasicFilterString(eq.Property, "=", eq.Value),
			Filter<T>.Has has => CreateBasicFilterString(has.Property, "=", has.Value),
			Filter<T>.Ne ne => CreateBasicFilterString(ne.Property, "!=", ne.Value),
			Filter<T>.Not not => $"NOT ({not.Filter.CreateMeilisearchFilter()})",
			Filter<T>.CmpRandom
				=> throw new ValidationException("Random comparison is not supported."),
			_ => null
		};
	}

	private static string CreateBasicFilterString(string property, string @operator, object? value)
	{
		return $"{CamelCase.ConvertName(property)} {@operator} {value.InMeilsearchFilterFormat()}";
	}

	private static object? InMeilsearchFilterFormat(this object? value)
	{
		return value switch
		{
			null => null,
			string s => s.Any(char.IsWhiteSpace) ? $"\"{s.Replace("\"", "\\\"")}\"" : s,
			DateTimeOffset dateTime => dateTime.ToUnixTimeSeconds(),
			DateOnly date => date.ToUnixTimeSeconds(),
			_ => value
		};
	}

	public static long ToUnixTimeSeconds(this DateOnly date)
	{
		return new DateTimeOffset(date.ToDateTime(new TimeOnly())).ToUnixTimeSeconds();
	}
}
