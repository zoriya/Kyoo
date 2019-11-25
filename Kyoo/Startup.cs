using Kyoo.InternalAPI;
using Kyoo.InternalAPI.ThumbnailsManager;
using Microsoft.AspNetCore.Builder;
using Microsoft.AspNetCore.Hosting;
using Microsoft.AspNetCore.Mvc;
using Microsoft.AspNetCore.SpaServices.AngularCli;
using Microsoft.Extensions.Configuration;
using Microsoft.Extensions.DependencyInjection;
using System.Web.Http;

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
            services.AddMvc().SetCompatibilityVersion(CompatibilityVersion.Version_2_1);

            // In production, the Angular files will be served from this directory
            services.AddSpaStaticFiles(configuration =>
            {
                configuration.RootPath = "ClientApp/dist";
            });

            //Services needed in the private and in the public API
            services.AddSingleton<ILibraryManager, LibraryManager>();
            services.AddSingleton<ITranscoder, Transcoder>();

            //Services used to get informations about files and register them
            services.AddSingleton<ICrawler, Crawler>();
            services.AddSingleton<IThumbnailsManager, ThumbnailsManager>();
            services.AddSingleton<IMetadataProvider, ProviderManager>();
        }

        // This method gets called by the runtime. Use this method to configure the HTTP request pipeline.
        public void Configure(IApplicationBuilder app, IHostingEnvironment env)
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
                ctx.Response.Headers.Add("Content-Security-Policy", "default-src 'self'; script-src 'self' 'unsafe-inline' 'unsafe-eval'; style-src 'self' 'unsafe-inline'");
                ctx.Response.Headers.Add("X-Frame-Options", "SAMEORIGIN");
                ctx.Response.Headers.Add("Referrer-Policy", "no-referrer");
                ctx.Response.Headers.Add("Access-Control-Allow-Origin", "null");
                ctx.Response.Headers.Add("X-Content-Type-Options", "nosniff");
                return next();
            });

            //app.UseHttpsRedirection();
            app.UseStaticFiles();
            app.UseSpaStaticFiles();

            app.UseMvc(routes =>
            {
                routes.MapRoute(
                    name: "API Route",
                    template: "api/{controller}/{id}",
                    defaults: new { id = RouteParameter.Optional });
            });

            app.UseSpa(spa =>
            {
                // To learn more about options for serving an Angular SPA from ASP.NET Core,
                // see https://go.microsoft.com/fwlink/?linkid=864501

                spa.Options.SourcePath = "ClientApp";

                if (env.IsDevelopment())
                {
                    spa.UseAngularCliServer(npmScript: "start");
                }
            });
        }
    }
}
