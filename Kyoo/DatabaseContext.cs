using System;
using System.Linq;
using Kyoo.Models;
using Microsoft.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore.ChangeTracking;
using Microsoft.EntityFrameworkCore.Storage.ValueConversion;

namespace Kyoo
{
    public class DatabaseContext : DbContext
    {
        public DatabaseContext(DbContextOptions options) : base(options) { }

        public DbSet<Library> Libraries { get; set; }
        public DbSet<Collection> Collections { get; set; }
        public DbSet<Show> Shows { get; set; }
        public DbSet<Season> Seasons { get; set; }
        public DbSet<Episode> Episodes { get; set; }
        public DbSet<Track> Tracks { get; set; }
        public DbSet<Genre> Genres { get; set; }
        public DbSet<People> Peoples { get; set; }
        public DbSet<Studio> Studios { get; set; }
        
        public DbSet<LibraryLink> LibraryLinks { get; set; }
        public DbSet<CollectionLink> CollectionLinks { get; set; }
        public DbSet<PeopleLink> PeopleLinks { get; set; }
        
        // This is used because EF doesn't support Many-To-Many relationships so for now we need to override the getter/setters to store this.
        public DbSet<GenreLink> GenreLinks { get; set; }
        
        
        private ValueConverter<string[], string> stringArrayConverter = new ValueConverter<string[], string>(
            arr => string.Join("|", arr),
            str => str.Split("|", StringSplitOptions.None));

        private ValueComparer<string[]> stringArrayComparer = new ValueComparer<string[]>(
            (l1, l2) => l1.SequenceEqual(l2),
            arr => arr.Aggregate(0, (i, s) => s.GetHashCode()));

        protected override void OnModelCreating(ModelBuilder modelBuilder)
        {
            base.OnModelCreating(modelBuilder);

            modelBuilder.Entity<Library>().Property(e => e.Paths).HasConversion(stringArrayConverter).Metadata.SetValueComparer(stringArrayComparer);
            modelBuilder.Entity<Library>().Property(e => e.Providers).HasConversion(stringArrayConverter).Metadata.SetValueComparer(stringArrayComparer);
            modelBuilder.Entity<Show>().Property(e => e.Aliases).HasConversion(stringArrayConverter).Metadata.SetValueComparer(stringArrayComparer);

            modelBuilder.Entity<Track>()
                .Property(t => t.IsDefault)
                .ValueGeneratedNever();
            
            modelBuilder.Entity<Track>()
                .Property(t => t.IsForced)
                .ValueGeneratedNever();

            modelBuilder.Entity<GenreLink>()
	            .HasKey(x => new {x.ShowID, x.GenreID});
	                        
            modelBuilder.Entity<Show>()
	            .Ignore(x => x.Genres);
            
            // modelBuilder.Entity<Genre>()
	           //  .Ignore(x => x.Shows);
        }
    }
}

public static class DbSetExtension
{
	public static EntityEntry<T> AddIfNotExist<T>(this DbSet<T> db, T entity, Func<T, bool> predicate) where T : class
	{
		bool exists = db.Any(predicate);
		return exists ? null : db.Add(entity);
	}
}