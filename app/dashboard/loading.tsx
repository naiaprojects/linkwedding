import LogoLoader from "@/components/LogoLoader";

export default function Loading() {
    return (
        <div className="flex h-full w-full items-center justify-center">
            <LogoLoader className="w-20 h-20" />
        </div>
    );
}
