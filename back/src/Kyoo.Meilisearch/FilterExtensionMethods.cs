using System.ComponentModel.DataAnnotations;
using Kyoo.Abstractions.Models.Utils;
using static System.Text.Json.JsonNamingPolicy;

namespace Kyoo.Meiliseach;

public static class FilterExtensionMethods
{
	public static string? CreateMeilisearchFilter<T>(this Filter<T>? filter)
	{
		return filter switch
		{
			Filter<T>.And and
				=> $"({and.First.CreateMeilisearchFilter()}) AND ({and.Second.CreateMeilisearchFilter()})",
			Filter<T>.Or or
				=> $"({or.First.CreateMeilisearchFilter()}) OR ({or.Second.CreateMeilisearchFilter()})",
			Filter<T>.Gt gt => $"{CamelCase.ConvertName(gt.Property)} > '{gt.Value}'",
			Filter<T>.Lt lt => $"{CamelCase.ConvertName(lt.Property)} < '{lt.Value}'",
			Filter<T>.Ge ge => $"{CamelCase.ConvertName(ge.Property)} >= '{ge.Value}'",
			Filter<T>.Le le => $"{CamelCase.ConvertName(le.Property)} <= '{le.Value}'",
			Filter<T>.Eq eq => $"{CamelCase.ConvertName(eq.Property)} = '{eq.Value}'",
			Filter<T>.Has has => $"{CamelCase.ConvertName(has.Property)} = '{has.Value}'",
			Filter<T>.Ne ne => $"{CamelCase.ConvertName(ne.Property)} != '{ne.Value}'",
			Filter<T>.Not not => $"NOT ({not.Filter.CreateMeilisearchFilter()})",
			Filter<T>.CmpRandom
				=> throw new ValidationException("Random comparison is not supported."),
			_ => null
		};
	}
}
