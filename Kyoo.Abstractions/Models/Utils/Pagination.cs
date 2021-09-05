namespace Kyoo.Abstractions.Controllers
{
	/// <summary>
	/// Information about the pagination. How many items should be displayed and where to start.
	/// </summary>
	public readonly struct Pagination
	{
		/// <summary>
		/// The count of items to return.
		/// </summary>
		public int Count { get; }

		/// <summary>
		/// Where to start? Using the given sort.
		/// </summary>
		public int AfterID { get; }

		/// <summary>
		/// Create a new <see cref="Pagination"/> instance.
		/// </summary>
		/// <param name="count">Set the <see cref="Count"/> value</param>
		/// <param name="afterID">Set the <see cref="AfterID"/> value. If not specified, it will start from the start</param>
		public Pagination(int count, int afterID = 0)
		{
			Count = count;
			AfterID = afterID;
		}

		/// <summary>
		/// Implicitly create a new pagination from a limit number.
		/// </summary>
		/// <param name="limit">Set the <see cref="Count"/> value</param>
		/// <returns>A new <see cref="Pagination"/> instance</returns>
		public static implicit operator Pagination(int limit) => new(limit);
	}
}
