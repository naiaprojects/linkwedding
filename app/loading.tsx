import LogoLoader from "@/components/LogoLoader";

export default function Loading() {
    return (
        <div className="flex items-center justify-center min-h-[60vh]">
            <LogoLoader className="w-24 h-24" />
        </div>
    );
}
