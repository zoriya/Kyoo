using Kyoo.Controllers;
using Microsoft.AspNetCore.Builder;
using Microsoft.AspNetCore.Hosting;
using Microsoft.AspNetCore.Identity;
using Microsoft.AspNetCore.SpaServices.AngularCli;
using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.Configuration;
using Microsoft.Extensions.DependencyInjection;
using Microsoft.Extensions.Hosting;
// ReSharper disable MemberCanBePrivate.Global
// ReSharper disable UnusedAutoPropertyAccessor.Global

namespace Kyoo
{
    public class Startup
    {
        public Startup(IConfiguration configuration)
        {
            Configuration = configuration;
        }

        public IConfiguration Configuration { get; }

        // This method gets called by the runtime. Use this method to add services to the container.
        public void ConfigureServices(IServiceCollection services)
        {
            // In production, the Angular files will be served from this directory
            services.AddSpaStaticFiles(configuration =>
            {
                configuration.RootPath = "ClientApp/dist";
            });

            services.AddControllers().AddNewtonsoftJson();
            services.AddHttpClient();

            services.AddDbContext<DatabaseContext>(options => options.UseLazyLoadingProxies()
	            .UseSqlite(Configuration.GetConnectionString("Database")));

            // services.AddIdentity<ApplicationUser, IdentityRole>()
            //     .AddEntityFrameworkStores()
            // services.AddIdentityServer();

            services.AddScoped<ILibraryManager, LibraryManager>();
            services.AddSingleton<ITranscoder, Transcoder>();
            services.AddSingleton<IThumbnailsManager, ThumbnailsManager>();
            services.AddSingleton<IProviderManager, ProviderManager>();
            services.AddScoped<ICrawler, Crawler>();
            services.AddSingleton<IPluginManager, PluginManager>();
            
            services.AddHostedService<StartupCode>();
        }

        // This method gets called by the runtime. Use this method to configure the HTTP request pipeline.
        public void Configure(IApplicationBuilder app, IWebHostEnvironment env)
        {
	        if (env.IsDevelopment())
            {
                app.UseDeveloperExceptionPage();
            }
            else
            {
                app.UseExceptionHandler("/Error");
                app.UseHsts();
            }

            app.Use((ctx, next) => 
            {
                ctx.Response.Headers.Remove("X-Powered-By");
                ctx.Response.Headers.Remove("Server");
                ctx.Response.Headers.Add("Feature-Policy", "autoplay 'self'; fullscreen");
                ctx.Response.Headers.Add("Content-Security-Policy", "default-src 'self' data: blob:; script-src 'self' 'unsafe-inline' 'unsafe-eval' data: blob:; style-src 'self' 'unsafe-inline'");
                ctx.Response.Headers.Add("X-Frame-Options", "SAMEORIGIN");
                ctx.Response.Headers.Add("Referrer-Policy", "no-referrer");
                ctx.Response.Headers.Add("Access-Control-Allow-Origin", "null");
                ctx.Response.Headers.Add("X-Content-Type-Options", "nosniff");
                return next();
            });

            //app.UseHttpsRedirection();
            app.UseStaticFiles();
            if (!env.IsDevelopment())
                app.UseSpaStaticFiles();

            app.UseRouting();

            app.UseEndpoints(endpoints =>
            {
                endpoints.MapControllerRoute("API Route", "api/{controller=Home}/{action=Index}/{id?}");
            });

            app.UseSpa(spa =>
            {
                spa.Options.SourcePath = "ClientApp";

                if (env.IsDevelopment())
                {
                    spa.UseAngularCliServer(npmScript: "start");
                }
            });
        }
    }
}
