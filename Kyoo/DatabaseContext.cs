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
        public DbSet<PeopleLink> PeopleLinks { get; set; }
        public DbSet<Studio> Studios { get; set; }
        
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
            
            modelBuilder.Entity<PeopleLink>()
                .HasOne(l => l.Show)
                .WithMany(s => s.People)
                .HasForeignKey(l => l.ShowID);
            
            modelBuilder.Entity<PeopleLink>()
                .HasOne(l => l.People)
                .WithMany(p => p.Roles)
                .HasForeignKey(l => l.PeopleID);

            modelBuilder.Entity<Track>()
                .Property(t => t.IsDefault)
                .ValueGeneratedNever();
            
            modelBuilder.Entity<Track>()
                .Property(t => t.IsForced)
                .ValueGeneratedNever();
        }
    }
}