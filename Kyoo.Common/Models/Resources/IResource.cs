using System;
using System.Collections.Generic;

namespace Kyoo.Models
{
	public interface IResource
	{
		public int ID { get; set; }
		public string Slug { get; } 
	}

	public class ResourceComparer<T> : IEqualityComparer<T> where T : IResource
	{
		public bool Equals(T x, T y)
		{
			if (ReferenceEquals(x, y))
				return true;
			if (ReferenceEquals(x, null))
				return false;
			if (ReferenceEquals(y, null))
				return false;
			return x.ID == y.ID || x.Slug == y.Slug;
		}

		public int GetHashCode(T obj)
		{
			return HashCode.Combine(obj.ID, obj.Slug);
		}
	}
}