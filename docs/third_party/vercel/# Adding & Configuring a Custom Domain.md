# Adding & Configuring a Custom Domain

Vercel provides all deployments with a `vercel.app` URL, which enables you to share Deployments with your Team for collaboration. However, to provide greater personalization and flexibility to your project, you can instead add a custom domain. If you don't own a domain yet, you can [purchase it with Vercel](/domains).

You can manage all domain settings related to a project in the Domains section of the Settings tab of the project, regardless of whether you are using [apex domains](#apex-domains) or [subdomains](#subdomains) in your project. This document will guide you through both options.

Hobby teams have a limit of 50 custom domains per project.

## [Add and configure domain](#add-and-configure-domain)

The following steps provide an overview of how to add and configure a custom domain in Vercel:

1.  ### [Navigate to Domain Settings](#navigate-to-domain-settings)

    On the [dashboard](/dashboard), pick the project to which you would like to assign your domain.

    Once you have selected your project, click on the Settings tab and then select the Domains menu item:

    ![Selecting the Domains menu item from the Project Settings page.](/vc-ap-vercel-docs/_next/image?url=https%3A%2F%2F7nyt0uhk7sse4zvn.public.blob.vercel-storage.com%2Fdocs-assets%2Fstatic%2Fdocs%2Fconcepts%2Fprojects%2Fcustom-domains%2Fselect-domains-light.png&w=828&q=75)![Selecting the Domains menu item from the Project Settings page.](/vc-ap-vercel-docs/_next/image?url=https%3A%2F%2F7nyt0uhk7sse4zvn.public.blob.vercel-storage.com%2Fdocs-assets%2Fstatic%2Fdocs%2Fconcepts%2Fprojects%2Fcustom-domains%2Fselect-domains-dark.png&w=828&q=75)

    Selecting the Domains menu item from the Project Settings page.

2.  ### [Add your domain](#add-your-domain)

    From the Domains page, click the Add Domain button:

    ![The button to click on the domains page.](/vc-ap-vercel-docs/_next/image?url=https%3A%2F%2F7nyt0uhk7sse4zvn.public.blob.vercel-storage.com%2Fdocs-assets%2Fstatic%2Fdocs%2Fdomains%2Fadd-domain-button-light.png&w=1920&q=75)![The button to click on the domains page.](/vc-ap-vercel-docs/_next/image?url=https%3A%2F%2F7nyt0uhk7sse4zvn.public.blob.vercel-storage.com%2Fdocs-assets%2Fstatic%2Fdocs%2Fdomains%2Fadd-domain-button-dark.png&w=1920&q=75)

    The button to click on the domains page.

    Input the domain you wish to include in the project:

    ![Text input on the add domain page to input your domain name in.](/vc-ap-vercel-docs/_next/image?url=https%3A%2F%2F7nyt0uhk7sse4zvn.public.blob.vercel-storage.com%2Fdocs-assets%2Fstatic%2Fdocs%2Fdomains%2Fenter-domain-input-light.png&w=1920&q=75)![Text input on the add domain page to input your domain name in.](/vc-ap-vercel-docs/_next/image?url=https%3A%2F%2F7nyt0uhk7sse4zvn.public.blob.vercel-storage.com%2Fdocs-assets%2Fstatic%2Fdocs%2Fdomains%2Fenter-domain-input-dark.png&w=1920&q=75)

    Text input on the add domain page to input your domain name in.

    If you add an apex domain (e.g. `example.com`) to the project, Vercel will prompt you to add the `www` subdomain prefix. For more information about why we recommend using a `www` domain, see "[Redirecting `www` domains](/docs/domains/deploying-and-redirecting#redirecting-www-domains)".

3.  ### [Using wildcard domain](#using-wildcard-domain)

    You can also use your custom domain as a wildcard domain by prefixing it with `*.`.

    If using your custom domain as a wildcard domain, you must use the nameservers method for verification.

    To add a wildcard domain, use the prefix `*`, for example `*.acme.com`.

    ![A wildcard domain being deployed.](/vc-ap-vercel-docs/_next/image?url=https%3A%2F%2F7nyt0uhk7sse4zvn.public.blob.vercel-storage.com%2Fdocs-assets%2Fstatic%2Fdocs%2Fconcepts%2Fprojects%2Fcustom-domains%2Fwildcard-domain.png&w=1920&q=75)![A wildcard domain being deployed.](/vc-ap-vercel-docs/_next/image?url=https%3A%2F%2F7nyt0uhk7sse4zvn.public.blob.vercel-storage.com%2Fdocs-assets%2Fstatic%2Fdocs%2Fconcepts%2Fprojects%2Fcustom-domains%2Fwildcard-domain-dark.png&w=1920&q=75)

    A wildcard domain being deployed.

4.  ### [Configure the domain](#configure-the-domain)

    Once you have added your custom domain, you will need to configure the DNS records of your domain with your registrar so it can be used with your Project. The dashboard will automatically display different methods for configuring it:
    - If the domain is in use by another Vercel account, you will need to [verify access to the domain](#verify-domain-access), with a TXT record
    - If you're using an [Apex domain](#apex-domains) (e.g. example.com), you will need to configure it with an A record
    - If you're using a [Subdomain](#subdomains) (e.g. docs.example.com), you will need to configure it with a CNAME record

    Both apex domains and subdomains can also be configured using the [Nameservers](#vercel-nameservers) method.

    If you are verifying your domain by changing nameservers, you will need to add any DNS records to Vercel that you wish to keep from your previous DNS provider.

    #### [Apex domains](#apex-domains)

    You can configure apex domains with an A record.

    ![DNS configuration for an apex domain.](/vc-ap-vercel-docs/_next/image?url=https%3A%2F%2F7nyt0uhk7sse4zvn.public.blob.vercel-storage.com%2Fdocs-assets%2Fstatic%2Fdocs%2Fconcepts%2Fprojects%2Fcustom-domains%2Fnew-domain-apex-light.png&w=1920&q=75)![DNS configuration for an apex domain.](/vc-ap-vercel-docs/_next/image?url=https%3A%2F%2F7nyt0uhk7sse4zvn.public.blob.vercel-storage.com%2Fdocs-assets%2Fstatic%2Fdocs%2Fconcepts%2Fprojects%2Fcustom-domains%2Fnew-domain-apex-dark.png&w=1920&q=75)

    DNS configuration for an apex domain.

    #### [Subdomains](#subdomains)

    You can configure subdomains with a CNAME record. Each project has a unique CNAME record e.g. `d1d4fc829fe7bc7c.vercel-dns-017.com`.

    ![DNS configuration for a subdomain.](/vc-ap-vercel-docs/_next/image?url=https%3A%2F%2F7nyt0uhk7sse4zvn.public.blob.vercel-storage.com%2Fdocs-assets%2Fstatic%2Fdocs%2Fconcepts%2Fprojects%2Fcustom-domains%2Fnew-domain-app-light.png&w=1920&q=75)![DNS configuration for a subdomain.](/vc-ap-vercel-docs/_next/image?url=https%3A%2F%2F7nyt0uhk7sse4zvn.public.blob.vercel-storage.com%2Fdocs-assets%2Fstatic%2Fdocs%2Fconcepts%2Fprojects%2Fcustom-domains%2Fnew-domain-app-dark.png&w=1920&q=75)

    DNS configuration for a subdomain.

    #### [Vercel Nameservers](#vercel-nameservers)

    If you choose to use a wildcard domain Vercel's nameservers will be automatically enabled for you on saving the domain settings. You will then be provided with the Vercel nameservers to copy and use with your registrar.

    ![DNS configuration for Vercel nameservers.](/vc-ap-vercel-docs/_next/image?url=https%3A%2F%2F7nyt0uhk7sse4zvn.public.blob.vercel-storage.com%2Fdocs-assets%2Fstatic%2Fdocs%2Fdomains%2Fconfigure-dns-ns-light.png&w=1920&q=75)![DNS configuration for Vercel nameservers.](/vc-ap-vercel-docs/_next/image?url=https%3A%2F%2F7nyt0uhk7sse4zvn.public.blob.vercel-storage.com%2Fdocs-assets%2Fstatic%2Fdocs%2Fdomains%2Fconfigure-dns-ns-dark.png&w=1920&q=75)

    DNS configuration for Vercel nameservers.

5.  ### [Verify domain access](#verify-domain-access)

    If the domain is in use by another Vercel account, you may be prompted to verify access to the domain. Note that this will not move the domain into your account, but will allow you to use it in your project. If you have multiple domains to verify, be aware that you can only set up one TXT record at a time, but you can modify it after the domain is transferred.

    ![Verify domain access.](/vc-ap-vercel-docs/_next/image?url=https%3A%2F%2F7nyt0uhk7sse4zvn.public.blob.vercel-storage.com%2Fdocs-assets%2Fstatic%2Fdocs%2Fdomains%2Fverify-domain-light.png&w=1920&q=75)![Verify domain access.](/vc-ap-vercel-docs/_next/image?url=https%3A%2F%2F7nyt0uhk7sse4zvn.public.blob.vercel-storage.com%2Fdocs-assets%2Fstatic%2Fdocs%2Fdomains%2Fverify-domain-dark.png&w=1920&q=75)

    Verify domain access.

Once the domain has been configured and Vercel has verified it, the status of the domain will be updated within the UI to confirm that it is ready for use.

![Properly configured domain.](/vc-ap-vercel-docs/_next/image?url=https%3A%2F%2F7nyt0uhk7sse4zvn.public.blob.vercel-storage.com%2Fdocs-assets%2Fstatic%2Fdocs%2Fdomains%2Fdomain-properly-configured-light.png&w=1200&q=75)![Properly configured domain.](/vc-ap-vercel-docs/_next/image?url=https%3A%2F%2F7nyt0uhk7sse4zvn.public.blob.vercel-storage.com%2Fdocs-assets%2Fstatic%2Fdocs%2Fdomains%2Fdomain-properly-configured-dark.png&w=1200&q=75)

Properly configured domain.

If a someone visits your domain with or without the "www" subdomain prefix, Vercel will attempt to redirect them to your domain. For more robust protection, you should explicitly add this domain and [redirect it](/docs/domains/deploying-and-redirecting#redirecting-domains).
