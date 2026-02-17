# Managing DNS Records

Once you've added a domain and it's using Vercel's nameservers, you can view its DNS records from your team's [Domains page](https://vercel.com/d?to=%2F%5Bteam%5D%2F%7E%2Fdomains&title=Go+to+team%27s+domains+page). From there, you can view, [add](#adding-dns-records), [verify](#verifying-dns-records), [remove the records](#removing-dns-records), or add [presets](#dns-presets).

To make sure DNS records are applied, and to allow you to manage them, your domain needs to use [Vercel's nameservers](/docs/domains/managing-nameservers) . If you are using a third-party domain, you will be provided with the Vercel nameservers to copy and use with your registrar.

## [Adding DNS Records](#adding-dns-records)

1.  ### [Selecting your Domain](#selecting-your-domain)

    On your team's [dashboard](/dashboard), select the Domains tab. From the Domains page, click on a domain of your choice to view its Advanced Settings page.

2.  ### [Add DNS Record](#add-dns-record)

    Once on the Advanced Settings page of your domain, select the Enable Vercel DNS button to fill out the DNS Record form. Once complete, click on the Add button.

    ![DNS Records form to add a new DNS Record.](/vc-ap-vercel-docs/_next/image?url=https%3A%2F%2F7nyt0uhk7sse4zvn.public.blob.vercel-storage.com%2Fdocs-assets%2Fstatic%2Fdocs%2Fconcepts%2Fprojects%2Fcustom-domains%2Fdns-records-form.png&w=3840&q=75)![DNS Records form to add a new DNS Record.](/vc-ap-vercel-docs/_next/image?url=https%3A%2F%2F7nyt0uhk7sse4zvn.public.blob.vercel-storage.com%2Fdocs-assets%2Fstatic%2Fdocs%2Fconcepts%2Fprojects%2Fcustom-domains%2Fdns-records-form-dark.png&w=3840&q=75)

    DNS Records form to add a new DNS Record.

    You can then create a new DNS record with the following data:
    - Name: The prefix or location of the record. For [www.example.com](http://www.example.com), the name argument would be [www](http://www).
    - Type: Types can be `A`, `AAAA`, `ALIAS`, `CAA`, `CNAME`, `HTTPS`, `MX`, `NS`, `SRV`, or `TXT`.
    - Value: The value of the record.
    - TTL: Default is 60 seconds. For advanced users, this value can be customized.
    - Comment: An optional comment to provide context on what this record is for.
    - More: Some records will require more data. MX records, for example, will request "priority".

      Once a DNS record has been added, it can take up to 24 hours to the DNS records to fully update and any local caches to be cleared.

## [Verifying DNS Records](#verifying-dns-records)

Once DNS records have been changed, you may wish to check that these have been set correctly. There are many third-party tools that do this, such as DNS Checker and DNS Map - these show the state of your DNS records in different regions of the world.

You can also use the `dig` command to check the DNS record for your domain:

terminal

```
$ dig A api.example.com +short
```

Verifying the A record set for a domain using the terminal.

terminal

```
$ dig MX example.com +short
```

Verifying the MX record set for a domain using the terminal.

## [Removing DNS Records](#removing-dns-records)

To remove DNS records:

1.  On your team's [dashboard](/dashboard), select the [Domains tab](https://vercel.com/d?to=%2F%5Bteam%5D%2F%7E%2Fdomains&title=Go+to+team%27s+domains+page). From the Domains page, click on a domain of your choice to view its Advanced Settings page.
2.  Select the ellipsis (⋯) to access the context menu and select Delete DNS Zone. Follow the prompts to delete the record.

Default records can't be removed. However, new records can override them if required.

![Removing a DNS record from the DNS UI.](/vc-ap-vercel-docs/_next/image?url=https%3A%2F%2F7nyt0uhk7sse4zvn.public.blob.vercel-storage.com%2Fdocs-assets%2Fstatic%2Fdocs%2Fconcepts%2Fprojects%2Fcustom-domains%2Fdelete-dns-record.png&w=3840&q=75)![Removing a DNS record from the DNS UI.](/vc-ap-vercel-docs/_next/image?url=https%3A%2F%2F7nyt0uhk7sse4zvn.public.blob.vercel-storage.com%2Fdocs-assets%2Fstatic%2Fdocs%2Fconcepts%2Fprojects%2Fcustom-domains%2Fdelete-dns-record-dark.png&w=3840&q=75)

Removing a DNS record from the DNS UI.

## [DNS Presets](#dns-presets)

Vercel does not provide an email service. To be able to receive emails or add specific DNS configurations through a domain that you've added to Vercel, you need to add the respective DNS Records, such as MX for email or TXT for other services.

Vercel streamlines this process for common third-party services by allowing you to add missing DNS Records using DNS Presets on your dashboard.

1.  From your [dashboard](/dashboard), navigate to the Domains tab.
2.  Select the domain you wish to add a preset to and click the Add DNS Preset dropdown on the right:

    ![Adding a DNS Preset by clicking the Add DNS Preset button.](/vc-ap-vercel-docs/_next/image?url=https%3A%2F%2F7nyt0uhk7sse4zvn.public.blob.vercel-storage.com%2Fdocs-assets%2Fstatic%2Fdocs%2Fconcepts%2Fprojects%2Fcustom-domains%2Fdns-presents-light.png&w=640&q=75)![Adding a DNS Preset by clicking the Add DNS Preset button.](/vc-ap-vercel-docs/_next/image?url=https%3A%2F%2F7nyt0uhk7sse4zvn.public.blob.vercel-storage.com%2Fdocs-assets%2Fstatic%2Fdocs%2Fconcepts%2Fprojects%2Fcustom-domains%2Fdns-presets-dark.png&w=640&q=75)

    Adding a DNS Preset by clicking the Add DNS Preset button.

3.  You will be presented with a list of commonly used third-party providers. If your provider is listed, select it, and the necessary DNS Records—such as MX for email or TXT for other services like [Bluesky](/kb/guide/use-my-domain-bluesky) will automatically be configured on your domain.

If your provider is not listed, please refer to their documentation to find out which DNS Records you need to add.

## [Migrating DNS records from an external registrar](#migrating-dns-records-from-an-external-registrar)

Once you have added a [domain to your Vercel project](https://vercel.com/docs/concepts/projects/custom-domains) and also verified the certificate is working as expected, you can choose three options of records to finally complete the migration: A, CNAME, or Nameservers. In case you decide to use an A or a CNAME record, then you can change those records in your DNS provider to make Vercel serve your deployment from the selected domain, as instructed on your dashboard.

If you decide to change the Nameservers of your domain, you can follow the below instructions which will help you migrate your DNS configuration from any provider and avoid downtime.

### [Clone the Current DNS Configuration](#clone-the-current-dns-configuration)

To locate the current DNS provider of your domain, you can run the following command:

terminal

```
$ dig NS example.com +short
```

Checking the DNS authority for a domain using the terminal.

The result will show the current DNS authority. Next, you'll need to locate your DNS records from the provider's dashboard.

After you've successfully located all records associated with your domain, you may now add them to Vercel. You can either do this manually or by importing a zone file.

Importing a zone file

If you have downloaded a zone file from your existing file, you may use the following comand to upload that to Vercel:

```
vercel dns import [your-domain] [zonefile]
```

If you do not apply a custom zone file, transferring in a domain automatically applies the default Vercel DNS settings.

### [Verify the Records](#verify-the-records)

To verify the records, you can now query the DNS configuration that will be served by Vercel:

terminal

```
$ dig A api.example.com +short @ns1.vercel-dns.com
```

Checking the DNS configuration of the A record under "api" served by Vercel.

Then, check the DNS records from the existing provider to make sure they match. If you were moving your DNS from [Cloudflare](https://vercel.com/docs/integrations/cloudflare), for example, the correct command would be:

terminal

```
$ dig A api.example.com +short @example.ns.cloudflare.com
```

Checking the DNS configuration of the A record under "api" served by Cloudflare. The example should be replaced with the authoritative nameserver given by your provider.

Before proceeding, we recommend checking every record you moved. For more insight into the DNS resolution, remove the `+short` flag.

### [Switch the Nameservers](#switch-the-nameservers)

In your registrar's dashboard (where you bought the domain), change the Nameservers to your new provider. Nameserver changes can take up to 48 hours to propagate. If you bought the domain from Vercel, you can [manage nameservers](https://vercel.com/docs/concepts/projects/domains/managing-nameservers) from the [domains page](https://vercel.com/dashboard/domains).
