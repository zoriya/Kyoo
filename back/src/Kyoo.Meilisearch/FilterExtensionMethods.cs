using System.Collections;
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
			Filter<T>.Gt gt => $"{CamelCase.ConvertName(gt.Property)} > {gt.Value.InMeilsearchFilterFormat()}",
			Filter<T>.Lt lt => $"{CamelCase.ConvertName(lt.Property)} < {lt.Value.InMeilsearchFilterFormat()}",
			Filter<T>.Ge ge => $"{CamelCase.ConvertName(ge.Property)} >= {ge.Value.InMeilsearchFilterFormat()}",
			Filter<T>.Le le => $"{CamelCase.ConvertName(le.Property)} <= {le.Value.InMeilsearchFilterFormat()}",
			Filter<T>.Eq eq => $"{CamelCase.ConvertName(eq.Property)} = {eq.Value.InMeilsearchFilterFormat()}",
			Filter<T>.Has has => $"{CamelCase.ConvertName(has.Property)} = {has.Value.InMeilsearchFilterFormat()}",
			Filter<T>.Ne ne => $"{CamelCase.ConvertName(ne.Property)} != {ne.Value.InMeilsearchFilterFormat()}",
			Filter<T>.Not not => $"NOT ({not.Filter.CreateMeilisearchFilter()})",
			Filter<T>.CmpRandom
				=> throw new ValidationException("Random comparison is not supported."),
			_ => null
		};
	}

	private static object? InMeilsearchFilterFormat(this object? value)
	{
		return value switch
		{
			null => null,
			string s => s.Any(char.IsWhiteSpace) ? $"\"{s}\"" : s,
			DateTimeOffset dateTime => dateTime.ToUnixTimeSeconds(),
			DateOnly date => date.ToUnixTimeSeconds(),
			_ => value
		};
	}

	public static object? InMeilisearchFormat(this object? value)
	{
		return value switch
		{
			null => null,
			string => value,
			Enum => value.ToString(),
			IEnumerable enumerable => enumerable.Cast<object>().Select(InMeilisearchFormat).ToArray(),
			DateTimeOffset dateTime => dateTime.ToUnixTimeSeconds(),
			DateOnly date => date.ToUnixTimeSeconds(),
			_ => value
		};
	}

	private static long ToUnixTimeSeconds(this DateOnly date)
	{
		return new DateTimeOffset(date.ToDateTime(new TimeOnly())).ToUnixTimeSeconds();
	}
}
