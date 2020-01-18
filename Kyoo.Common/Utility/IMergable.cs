using System.Collections.Generic;

namespace Kyoo.Utility
{
	public interface IMergable<T>
	{
		public T Merge(T other);
	}
}