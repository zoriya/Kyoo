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
			if (x.GetType() != y.GetType())
				return false;
			return x.ID == y.ID || x.Slug == y.Slug;
		}

		public int GetHashCode(T obj)
		{
			return HashCode.Combine(obj.ID, obj.Slug);
		}
	}
	
	public class LinkComparer<T, T2> : IEqualityComparer<IResourceLink<T, T2>>
		where T : IResource
		where T2 : IResource
	{
		public bool Equals(IResourceLink<T, T2> x, IResourceLink<T, T2> y)
		{
			if (ReferenceEquals(x, y))
				return true;
			if (ReferenceEquals(x, null))
				return false;
			if (ReferenceEquals(y, null))
				return false;
			if (x.GetType() != y.GetType())
				return false;
			return Utility.LinkEquals(x.Parent, x.ParentID, y.Parent, y.ParentID)
			       && Utility.LinkEquals(x.Child, x.ChildID, y.Child, y.ChildID);
		}

		public int GetHashCode(IResourceLink<T, T2> obj)
		{
			return HashCode.Combine(obj.Parent, obj.ParentID, obj.Child, obj.ChildID);
		}
	}
}