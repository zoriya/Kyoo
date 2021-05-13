using System;
using Microsoft.Extensions.DependencyInjection;

namespace Kyoo.Models
{
	public class LazyDi<T> : Lazy<T>
	{
		public LazyDi(IServiceProvider provider)
			: base(provider.GetRequiredService<T>)
		{ }
	}
}