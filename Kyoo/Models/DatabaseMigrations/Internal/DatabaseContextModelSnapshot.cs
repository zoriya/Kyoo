﻿// <auto-generated />
using System;
using System.Collections.Generic;
using Kyoo;
using Microsoft.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore.Infrastructure;
using Microsoft.EntityFrameworkCore.Storage.ValueConversion;
using Npgsql.EntityFrameworkCore.PostgreSQL.Metadata;

namespace Kyoo.Models.DatabaseMigrations.Internal
{
    [DbContext(typeof(DatabaseContext))]
    partial class DatabaseContextModelSnapshot : ModelSnapshot
    {
        protected override void BuildModel(ModelBuilder modelBuilder)
        {
#pragma warning disable 612, 618
            modelBuilder
                .HasAnnotation("Npgsql:Enum:item_type", "show,movie,collection")
                .HasAnnotation("Npgsql:Enum:status", "finished,airing,planned,unknown")
                .HasAnnotation("Npgsql:Enum:stream_type", "unknow,video,audio,subtitle")
                .HasAnnotation("Npgsql:ValueGenerationStrategy", NpgsqlValueGenerationStrategy.IdentityByDefaultColumn)
                .HasAnnotation("ProductVersion", "3.1.3")
                .HasAnnotation("Relational:MaxIdentifierLength", 63);

            modelBuilder.Entity("Kyoo.Models.CollectionDE", b =>
                {
                    b.Property<int>("ID")
                        .ValueGeneratedOnAdd()
                        .HasColumnType("integer")
                        .HasAnnotation("Npgsql:ValueGenerationStrategy", NpgsqlValueGenerationStrategy.IdentityByDefaultColumn);

                    b.Property<string>("Name")
                        .HasColumnType("text");

                    b.Property<string>("Overview")
                        .HasColumnType("text");

                    b.Property<string>("Poster")
                        .HasColumnType("text");

                    b.Property<string>("Slug")
                        .IsRequired()
                        .HasColumnType("text");

                    b.HasKey("ID");

                    b.HasIndex("Slug")
                        .IsUnique();

                    b.ToTable("Collections");

                    b.HasDiscriminator();
                });

            modelBuilder.Entity("Kyoo.Models.CollectionLink", b =>
                {
                    b.Property<int>("ID")
                        .ValueGeneratedOnAdd()
                        .HasColumnType("integer")
                        .HasAnnotation("Npgsql:ValueGenerationStrategy", NpgsqlValueGenerationStrategy.IdentityByDefaultColumn);

                    b.Property<int?>("CollectionID")
                        .HasColumnType("integer");

                    b.Property<int>("ShowID")
                        .HasColumnType("integer");

                    b.HasKey("ID");

                    b.HasIndex("ShowID");

                    b.HasIndex("CollectionID", "ShowID")
                        .IsUnique();

                    b.ToTable("CollectionLinks");
                });

            modelBuilder.Entity("Kyoo.Models.Episode", b =>
                {
                    b.Property<int>("ID")
                        .ValueGeneratedOnAdd()
                        .HasColumnType("integer")
                        .HasAnnotation("Npgsql:ValueGenerationStrategy", NpgsqlValueGenerationStrategy.IdentityByDefaultColumn);

                    b.Property<int>("AbsoluteNumber")
                        .HasColumnType("integer");

                    b.Property<int>("EpisodeNumber")
                        .HasColumnType("integer");

                    b.Property<string>("Overview")
                        .HasColumnType("text");

                    b.Property<string>("Path")
                        .HasColumnType("text");

                    b.Property<string>("Poster")
                        .HasColumnType("text");

                    b.Property<DateTime?>("ReleaseDate")
                        .HasColumnType("timestamp without time zone");

                    b.Property<int>("Runtime")
                        .HasColumnType("integer");

                    b.Property<int?>("SeasonID")
                        .HasColumnType("integer");

                    b.Property<int>("SeasonNumber")
                        .HasColumnType("integer");

                    b.Property<int>("ShowID")
                        .HasColumnType("integer");

                    b.Property<string>("Title")
                        .HasColumnType("text");

                    b.HasKey("ID");

                    b.HasIndex("SeasonID");

                    b.HasIndex("ShowID", "SeasonNumber", "EpisodeNumber", "AbsoluteNumber")
                        .IsUnique();

                    b.ToTable("Episodes");
                });

            modelBuilder.Entity("Kyoo.Models.GenreDE", b =>
                {
                    b.Property<int>("ID")
                        .ValueGeneratedOnAdd()
                        .HasColumnType("integer")
                        .HasAnnotation("Npgsql:ValueGenerationStrategy", NpgsqlValueGenerationStrategy.IdentityByDefaultColumn);

                    b.Property<string>("Name")
                        .HasColumnType("text");

                    b.Property<string>("Slug")
                        .IsRequired()
                        .HasColumnType("text");

                    b.HasKey("ID");

                    b.HasIndex("Slug")
                        .IsUnique();

                    b.ToTable("Genres");

                    b.HasDiscriminator();
                });

            modelBuilder.Entity("Kyoo.Models.GenreLink", b =>
                {
                    b.Property<int>("ShowID")
                        .HasColumnType("integer");

                    b.Property<int>("GenreID")
                        .HasColumnType("integer");

                    b.HasKey("ShowID", "GenreID");

                    b.HasIndex("GenreID");

                    b.ToTable("GenreLinks");
                });

            modelBuilder.Entity("Kyoo.Models.LibraryDE", b =>
                {
                    b.Property<int>("ID")
                        .ValueGeneratedOnAdd()
                        .HasColumnType("integer")
                        .HasAnnotation("Npgsql:ValueGenerationStrategy", NpgsqlValueGenerationStrategy.IdentityByDefaultColumn);

                    b.Property<string>("Name")
                        .HasColumnType("text");

                    b.Property<IEnumerable<string>>("Paths")
                        .HasColumnType("text[]");

                    b.Property<string>("Slug")
                        .IsRequired()
                        .HasColumnType("text");

                    b.HasKey("ID");

                    b.HasIndex("Slug")
                        .IsUnique();

                    b.ToTable("Libraries");

                    b.HasDiscriminator();
                });

            modelBuilder.Entity("Kyoo.Models.LibraryLink", b =>
                {
                    b.Property<int>("ID")
                        .ValueGeneratedOnAdd()
                        .HasColumnType("integer")
                        .HasAnnotation("Npgsql:ValueGenerationStrategy", NpgsqlValueGenerationStrategy.IdentityByDefaultColumn);

                    b.Property<int?>("CollectionID")
                        .HasColumnType("integer");

                    b.Property<int>("LibraryID")
                        .HasColumnType("integer");

                    b.Property<int?>("ShowID")
                        .HasColumnType("integer");

                    b.HasKey("ID");

                    b.HasIndex("CollectionID");

                    b.HasIndex("ShowID");

                    b.HasIndex("LibraryID", "CollectionID")
                        .IsUnique();

                    b.HasIndex("LibraryID", "ShowID")
                        .IsUnique();

                    b.ToTable("LibraryLinks");
                });

            modelBuilder.Entity("Kyoo.Models.MetadataID", b =>
                {
                    b.Property<int>("ID")
                        .ValueGeneratedOnAdd()
                        .HasColumnType("integer")
                        .HasAnnotation("Npgsql:ValueGenerationStrategy", NpgsqlValueGenerationStrategy.IdentityByDefaultColumn);

                    b.Property<string>("DataID")
                        .HasColumnType("text");

                    b.Property<int?>("EpisodeID")
                        .HasColumnType("integer");

                    b.Property<string>("Link")
                        .HasColumnType("text");

                    b.Property<int?>("PeopleID")
                        .HasColumnType("integer");

                    b.Property<int>("ProviderID")
                        .HasColumnType("integer");

                    b.Property<int?>("SeasonID")
                        .HasColumnType("integer");

                    b.Property<int?>("ShowID")
                        .HasColumnType("integer");

                    b.HasKey("ID");

                    b.HasIndex("EpisodeID");

                    b.HasIndex("PeopleID");

                    b.HasIndex("ProviderID");

                    b.HasIndex("SeasonID");

                    b.HasIndex("ShowID");

                    b.ToTable("MetadataIds");
                });

            modelBuilder.Entity("Kyoo.Models.People", b =>
                {
                    b.Property<int>("ID")
                        .ValueGeneratedOnAdd()
                        .HasColumnType("integer")
                        .HasAnnotation("Npgsql:ValueGenerationStrategy", NpgsqlValueGenerationStrategy.IdentityByDefaultColumn);

                    b.Property<string>("Name")
                        .HasColumnType("text");

                    b.Property<string>("Poster")
                        .HasColumnType("text");

                    b.Property<string>("Slug")
                        .IsRequired()
                        .HasColumnType("text");

                    b.HasKey("ID");

                    b.HasIndex("Slug")
                        .IsUnique();

                    b.ToTable("People");
                });

            modelBuilder.Entity("Kyoo.Models.PeopleRole", b =>
                {
                    b.Property<int>("ID")
                        .ValueGeneratedOnAdd()
                        .HasColumnType("integer")
                        .HasAnnotation("Npgsql:ValueGenerationStrategy", NpgsqlValueGenerationStrategy.IdentityByDefaultColumn);

                    b.Property<int>("PeopleID")
                        .HasColumnType("integer");

                    b.Property<string>("Role")
                        .HasColumnType("text");

                    b.Property<int>("ShowID")
                        .HasColumnType("integer");

                    b.Property<string>("Type")
                        .HasColumnType("text");

                    b.HasKey("ID");

                    b.HasIndex("PeopleID");

                    b.HasIndex("ShowID");

                    b.ToTable("PeopleRoles");
                });

            modelBuilder.Entity("Kyoo.Models.ProviderID", b =>
                {
                    b.Property<int>("ID")
                        .ValueGeneratedOnAdd()
                        .HasColumnType("integer")
                        .HasAnnotation("Npgsql:ValueGenerationStrategy", NpgsqlValueGenerationStrategy.IdentityByDefaultColumn);

                    b.Property<string>("Logo")
                        .HasColumnType("text");

                    b.Property<string>("Name")
                        .HasColumnType("text");

                    b.Property<string>("Slug")
                        .IsRequired()
                        .HasColumnType("text");

                    b.HasKey("ID");

                    b.HasIndex("Slug")
                        .IsUnique();

                    b.ToTable("Providers");
                });

            modelBuilder.Entity("Kyoo.Models.ProviderLink", b =>
                {
                    b.Property<int>("ID")
                        .ValueGeneratedOnAdd()
                        .HasColumnType("integer")
                        .HasAnnotation("Npgsql:ValueGenerationStrategy", NpgsqlValueGenerationStrategy.IdentityByDefaultColumn);

                    b.Property<int?>("LibraryID")
                        .HasColumnType("integer");

                    b.Property<int>("ProviderID")
                        .HasColumnType("integer");

                    b.HasKey("ID");

                    b.HasIndex("LibraryID");

                    b.HasIndex("ProviderID");

                    b.ToTable("ProviderLinks");
                });

            modelBuilder.Entity("Kyoo.Models.Season", b =>
                {
                    b.Property<int>("ID")
                        .ValueGeneratedOnAdd()
                        .HasColumnType("integer")
                        .HasAnnotation("Npgsql:ValueGenerationStrategy", NpgsqlValueGenerationStrategy.IdentityByDefaultColumn);

                    b.Property<string>("Overview")
                        .HasColumnType("text");

                    b.Property<string>("Poster")
                        .HasColumnType("text");

                    b.Property<int>("SeasonNumber")
                        .HasColumnType("integer");

                    b.Property<int>("ShowID")
                        .HasColumnType("integer");

                    b.Property<string>("Title")
                        .HasColumnType("text");

                    b.Property<int?>("Year")
                        .HasColumnType("integer");

                    b.HasKey("ID");

                    b.HasIndex("ShowID", "SeasonNumber")
                        .IsUnique();

                    b.ToTable("Seasons");
                });

            modelBuilder.Entity("Kyoo.Models.ShowDE", b =>
                {
                    b.Property<int>("ID")
                        .ValueGeneratedOnAdd()
                        .HasColumnType("integer")
                        .HasAnnotation("Npgsql:ValueGenerationStrategy", NpgsqlValueGenerationStrategy.IdentityByDefaultColumn);

                    b.Property<IEnumerable<string>>("Aliases")
                        .HasColumnType("text[]");

                    b.Property<string>("Backdrop")
                        .HasColumnType("text");

                    b.Property<int?>("EndYear")
                        .HasColumnType("integer");

                    b.Property<bool>("IsMovie")
                        .HasColumnType("boolean");

                    b.Property<string>("Logo")
                        .HasColumnType("text");

                    b.Property<string>("Overview")
                        .HasColumnType("text");

                    b.Property<string>("Path")
                        .HasColumnType("text");

                    b.Property<string>("Poster")
                        .HasColumnType("text");

                    b.Property<string>("Slug")
                        .IsRequired()
                        .HasColumnType("text");

                    b.Property<int?>("StartYear")
                        .HasColumnType("integer");

                    b.Property<int?>("Status")
                        .HasColumnType("integer");

                    b.Property<int?>("StudioID")
                        .HasColumnType("integer");

                    b.Property<string>("Title")
                        .HasColumnType("text");

                    b.Property<string>("TrailerUrl")
                        .HasColumnType("text");

                    b.HasKey("ID");

                    b.HasIndex("Slug")
                        .IsUnique();

                    b.HasIndex("StudioID");

                    b.ToTable("Shows");

                    b.HasDiscriminator();
                });

            modelBuilder.Entity("Kyoo.Models.Studio", b =>
                {
                    b.Property<int>("ID")
                        .ValueGeneratedOnAdd()
                        .HasColumnType("integer")
                        .HasAnnotation("Npgsql:ValueGenerationStrategy", NpgsqlValueGenerationStrategy.IdentityByDefaultColumn);

                    b.Property<string>("Name")
                        .HasColumnType("text");

                    b.Property<string>("Slug")
                        .IsRequired()
                        .HasColumnType("text");

                    b.HasKey("ID");

                    b.HasIndex("Slug")
                        .IsUnique();

                    b.ToTable("Studios");
                });

            modelBuilder.Entity("Kyoo.Models.Track", b =>
                {
                    b.Property<int>("ID")
                        .ValueGeneratedOnAdd()
                        .HasColumnType("integer")
                        .HasAnnotation("Npgsql:ValueGenerationStrategy", NpgsqlValueGenerationStrategy.IdentityByDefaultColumn);

                    b.Property<string>("Codec")
                        .HasColumnType("text");

                    b.Property<int>("EpisodeID")
                        .HasColumnType("integer");

                    b.Property<bool>("IsDefault")
                        .HasColumnType("boolean");

                    b.Property<bool>("IsExternal")
                        .HasColumnType("boolean");

                    b.Property<bool>("IsForced")
                        .HasColumnType("boolean");

                    b.Property<string>("Language")
                        .HasColumnType("text");

                    b.Property<string>("Path")
                        .HasColumnType("text");

                    b.Property<string>("Title")
                        .HasColumnType("text");

                    b.Property<int>("Type")
                        .HasColumnType("integer");

                    b.HasKey("ID");

                    b.HasIndex("EpisodeID");

                    b.ToTable("Tracks");
                });

            modelBuilder.Entity("Kyoo.Models.CollectionLink", b =>
                {
                    b.HasOne("Kyoo.Models.CollectionDE", "Collection")
                        .WithMany("Links")
                        .HasForeignKey("CollectionID");

                    b.HasOne("Kyoo.Models.ShowDE", "Show")
                        .WithMany("CollectionLinks")
                        .HasForeignKey("ShowID")
                        .OnDelete(DeleteBehavior.Cascade)
                        .IsRequired();
                });

            modelBuilder.Entity("Kyoo.Models.Episode", b =>
                {
                    b.HasOne("Kyoo.Models.Season", "Season")
                        .WithMany("Episodes")
                        .HasForeignKey("SeasonID");

                    b.HasOne("Kyoo.Models.ShowDE", "Show")
                        .WithMany("Episodes")
                        .HasForeignKey("ShowID")
                        .OnDelete(DeleteBehavior.Cascade)
                        .IsRequired();
                });

            modelBuilder.Entity("Kyoo.Models.GenreLink", b =>
                {
                    b.HasOne("Kyoo.Models.GenreDE", "Genre")
                        .WithMany("Links")
                        .HasForeignKey("GenreID")
                        .OnDelete(DeleteBehavior.Cascade)
                        .IsRequired();

                    b.HasOne("Kyoo.Models.ShowDE", "Show")
                        .WithMany("GenreLinks")
                        .HasForeignKey("ShowID")
                        .OnDelete(DeleteBehavior.Cascade)
                        .IsRequired();
                });

            modelBuilder.Entity("Kyoo.Models.LibraryLink", b =>
                {
                    b.HasOne("Kyoo.Models.CollectionDE", "Collection")
                        .WithMany("LibraryLinks")
                        .HasForeignKey("CollectionID");

                    b.HasOne("Kyoo.Models.LibraryDE", "Library")
                        .WithMany("Links")
                        .HasForeignKey("LibraryID")
                        .OnDelete(DeleteBehavior.Cascade)
                        .IsRequired();

                    b.HasOne("Kyoo.Models.ShowDE", "Show")
                        .WithMany("LibraryLinks")
                        .HasForeignKey("ShowID");
                });

            modelBuilder.Entity("Kyoo.Models.MetadataID", b =>
                {
                    b.HasOne("Kyoo.Models.Episode", "Episode")
                        .WithMany("ExternalIDs")
                        .HasForeignKey("EpisodeID")
                        .OnDelete(DeleteBehavior.Cascade);

                    b.HasOne("Kyoo.Models.People", "People")
                        .WithMany("ExternalIDs")
                        .HasForeignKey("PeopleID")
                        .OnDelete(DeleteBehavior.Cascade);

                    b.HasOne("Kyoo.Models.ProviderID", "Provider")
                        .WithMany()
                        .HasForeignKey("ProviderID")
                        .OnDelete(DeleteBehavior.Cascade)
                        .IsRequired();

                    b.HasOne("Kyoo.Models.Season", "Season")
                        .WithMany("ExternalIDs")
                        .HasForeignKey("SeasonID")
                        .OnDelete(DeleteBehavior.Cascade);

                    b.HasOne("Kyoo.Models.ShowDE", "Show")
                        .WithMany("ExternalIDs")
                        .HasForeignKey("ShowID")
                        .OnDelete(DeleteBehavior.Cascade);
                });

            modelBuilder.Entity("Kyoo.Models.PeopleRole", b =>
                {
                    b.HasOne("Kyoo.Models.People", "People")
                        .WithMany("Roles")
                        .HasForeignKey("PeopleID")
                        .OnDelete(DeleteBehavior.Cascade)
                        .IsRequired();

                    b.HasOne("Kyoo.Models.ShowDE", "Show")
                        .WithMany("People")
                        .HasForeignKey("ShowID")
                        .OnDelete(DeleteBehavior.Cascade)
                        .IsRequired();
                });

            modelBuilder.Entity("Kyoo.Models.ProviderLink", b =>
                {
                    b.HasOne("Kyoo.Models.LibraryDE", "Library")
                        .WithMany("ProviderLinks")
                        .HasForeignKey("LibraryID");

                    b.HasOne("Kyoo.Models.ProviderID", "Provider")
                        .WithMany()
                        .HasForeignKey("ProviderID")
                        .OnDelete(DeleteBehavior.Cascade)
                        .IsRequired();
                });

            modelBuilder.Entity("Kyoo.Models.Season", b =>
                {
                    b.HasOne("Kyoo.Models.ShowDE", "Show")
                        .WithMany("Seasons")
                        .HasForeignKey("ShowID")
                        .OnDelete(DeleteBehavior.Cascade)
                        .IsRequired();
                });

            modelBuilder.Entity("Kyoo.Models.ShowDE", b =>
                {
                    b.HasOne("Kyoo.Models.Studio", "Studio")
                        .WithMany()
                        .HasForeignKey("StudioID");
                });

            modelBuilder.Entity("Kyoo.Models.Track", b =>
                {
                    b.HasOne("Kyoo.Models.Episode", "Episode")
                        .WithMany("Tracks")
                        .HasForeignKey("EpisodeID")
                        .OnDelete(DeleteBehavior.Cascade)
                        .IsRequired();
                });
#pragma warning restore 612, 618
        }
    }
}
