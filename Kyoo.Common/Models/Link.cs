using System;
using System.Linq.Expressions;

namespace Kyoo.Models
{
	/// <summary>
	/// A class representing a link between two resources.
	/// </summary>
	/// <remarks>
	/// Links should only be used on the data layer and not on other application code.
	/// </remarks>
	public class Link
	{
		/// <summary>
		/// The ID of the first item of the link.
		/// The first item of the link should be the one to own the link.
		/// </summary>
		public int FirstID { get; set; }
		
		/// <summary>
		/// The ID of the second item of this link
		/// The second item of the link should be the owned resource.
		/// </summary>
		public int SecondID { get; set; }
		
		/// <summary>
		/// Create a new typeless <see cref="Link"/>.
		/// </summary>
		public Link() {}

		/// <summary>
		/// Create a new typeless <see cref="Link"/> with two IDs.
		/// </summary>
		/// <param name="firstID">The ID of the first resource</param>
		/// <param name="secondID">The ID of the second resource</param>
		public Link(int firstID, int secondID)
		{
			FirstID = firstID;
			SecondID = secondID;
		}
		
		/// <summary>
		/// Create a new typeless <see cref="Link"/> between two resources.
		/// </summary>
		/// <param name="first">The first resource</param>
		/// <param name="second">The second resource</param>
		public Link(IResource first, IResource second)
		{
			FirstID = first.ID;
			SecondID = second.ID;
		}

		/// <summary>
		/// Create a new typed link between two resources.
		/// This method can be used instead of the constructor to make use of generic parameters deduction.
		/// </summary>
		/// <param name="first">The first resource</param>
		/// <param name="second">The second resource</param>
		/// <typeparam name="T">The type of the first resource</typeparam>
		/// <typeparam name="T2">The type of the second resource</typeparam>
		/// <returns>A newly created typed link with both resources</returns>
		public static Link<T, T2> Create<T, T2>(T first, T2 second)
			where T : class, IResource
			where T2 : class, IResource
		{
			return new(first, second);
		}
		
		/// <summary>
		/// Create a new typed link between two resources without storing references to resources.
		/// This is the same as <see cref="Create{T,T2}"/> but this method does not set <see cref="Link{T1,T2}.First"/>
		/// and <see cref="Link{T1,T2}.Second"/> fields. Only IDs are stored and not references.
		/// </summary>
		/// <param name="first">The first resource</param>
		/// <param name="second">The second resource</param>
		/// <typeparam name="T">The type of the first resource</typeparam>
		/// <typeparam name="T2">The type of the second resource</typeparam>
		/// <returns>A newly created typed link with both resources</returns>
		public static Link<T, T2> UCreate<T, T2>(T first, T2 second)
			where T : class, IResource
			where T2 : class, IResource
		{
			return new(first, second, true);
		}
		
		/// <summary>
		/// The expression to retrieve the unique ID of a Link. This is an aggregate of the two resources IDs.
		/// </summary>
		public static Expression<Func<Link, object>> PrimaryKey
		{
			get
			{
				return x => new {First = x.FirstID, Second = x.SecondID};
			}	
		}
	}
	
	/// <summary>
	/// A strongly typed link between two resources.
	/// </summary>
	/// <typeparam name="T1">The type of the first resource</typeparam>
	/// <typeparam name="T2">The type of the second resource</typeparam>
	public class Link<T1, T2> : Link
		where T1 : class, IResource
		where T2 : class, IResource
	{
		/// <summary>
		/// A reference of the first resource.
		/// </summary>
		public T1 First { get; set; }
		
		/// <summary>
		/// A reference to the second resource.
		/// </summary>
		public T2 Second { get; set; }
		
		
		/// <summary>
		/// Create a new, empty, typed <see cref="Link{T1,T2}"/>.
		/// </summary>
		public Link() {}
		
		
		/// <summary>
		/// Create a new typed link with two resources.
		/// </summary>
		/// <param name="first">The first resource</param>
		/// <param name="second">The second resource</param>
		/// <param name="privateItems">
		/// True if no reference to resources should be kept, false otherwise.
		/// The default is false (references are kept).
		/// </param>
		public Link(T1 first, T2 second, bool privateItems = false)
			: base(first, second)
		{
			if (privateItems)
				return;
			First = first;
			Second = second;
		}

		/// <summary>
		/// Create a new typed link with IDs only.
		/// </summary>
		/// <param name="firstID">The ID of the first resource</param>
		/// <param name="secondID">The ID of the second resource</param>
		public Link(int firstID, int secondID)
			: base(firstID, secondID)
		{ }

		/// <summary>
		/// The expression to retrieve the unique ID of a typed Link. This is an aggregate of the two resources IDs.
		/// </summary>
		public new static Expression<Func<Link<T1, T2>, object>> PrimaryKey
		{
			get
			{
				return x => new {First = x.FirstID, Second = x.SecondID};
			}	
		}
	}
}