using System;
using System.Collections.Generic;

namespace Kyoo.Models
{
	public interface IResource
	{
		public int ID { get; set; }
		public string Slug { get; } 
	}

	public interface IResourceLink<out T, out T2>
		where T : IResource 
		where T2 : IResource
	{
		public T Parent { get; }
		public int ParentID { get; }
		public T2 Child { get; }
		public int ChildID { get; }
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
	
	public class LinkComparer<T, T1, T2> : IEqualityComparer<T>
		where T : IResourceLink<T1, T2>
		where T1 : IResource
		where T2 : IResource
	{
		public bool Equals(T x, T y)
		{
			if (ReferenceEquals(x, y))
				return true;
			if (ReferenceEquals(x, null))
				return false;
			if (ReferenceEquals(y, null))
				return false;
			return Utility.LinkEquals(x.Parent, x.ParentID, y.Parent, y.ParentID)
			       && Utility.LinkEquals(x.Child, x.ChildID, y.Child, y.ChildID);
		}

		public int GetHashCode(T obj)
		{
			return HashCode.Combine(obj.Parent, obj.ParentID, obj.Child, obj.ChildID);
		}
	}
}